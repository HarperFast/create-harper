#!/usr/bin/env node
/**
 * Runtime smoke test for a generated template application.
 *
 * Boots the app under a real Harper instance (isolated root, throwaway admin user) and verifies
 * the HTTP surface every template must provide:
 *
 *   1. REST resources are reachable over GET — a `resources/` class must answer with JSON.
 *      This is the regression check for the static `notFound`/`fallthrough: false` catch-all,
 *      which ran before the REST handler and answered resource GETs with index.html.
 *   2. The frontend is served — `GET /` returns the app's HTML.
 *
 * Usage: node template.tests/runtimeSmoke.js <app-dir>
 *
 * The app must already be installed (and built, for templates with a build step). Requires the
 * `harper` CLI on PATH (or set HARPER_BIN). POSIX only. Ports override via SMOKE_HTTP_PORT /
 * SMOKE_OPS_PORT.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const appDir = process.argv[2] && path.resolve(process.argv[2]);
if (!appDir || !fs.existsSync(path.join(appDir, 'config.yaml'))) {
	console.error('Usage: node template.tests/runtimeSmoke.js <app-dir> (must contain a config.yaml)');
	process.exit(2);
}

const httpPort = Number(process.env.SMOKE_HTTP_PORT ?? 19926);
const opsPort = Number(process.env.SMOKE_OPS_PORT ?? 19925);
const baseUrl = `http://127.0.0.1:${httpPort}`;
const credentials = `Basic ${Buffer.from('smoke-admin:smoke-password').toString('base64')}`;

// Harper's operations server listens on a unix domain socket inside ROOTPATH, and socket paths
// are limited to ~104 characters on macOS — so keep the scratch root short and in /tmp.
const scratchDir = fs.mkdtempSync('/tmp/harper-smoke-');
const rootPath = path.join(scratchDir, 'hdb');
const homeDir = path.join(scratchDir, 'home');
fs.mkdirSync(rootPath);
fs.mkdirSync(homeDir);

// The REST resource the test queries. Written into the app like a user would add one; the
// extension must match the template's jsResource glob (`resources/*.ts` in TS templates).
const isTypeScript = fs.readFileSync(path.join(appDir, 'config.yaml'), 'utf-8').includes('resources/*.ts');
const resourcePath = path.join(appDir, 'resources', `smokeTestResource.${isTypeScript ? 'ts' : 'js'}`);
fs.writeFileSync(
	resourcePath,
	`export class SmokeTestResource extends Resource {
	allowRead() {
		return true;
	}
	async get() {
		return { smoke: 'ok' };
	}
}
`,
);

const harperBin = process.env.HARPER_BIN ?? 'harper';
console.log(`Starting ${harperBin} run ${appDir} (root: ${rootPath}, port: ${httpPort})...`);
const harper = spawn(harperBin, ['run', appDir], {
	env: {
		...process.env,
		// HOME controls where Harper looks for the boot-properties file of an existing
		// installation; pointing it at a scratch dir guarantees an isolated, fresh install.
		HOME: homeDir,
		TC_AGREEMENT: 'yes',
		HDB_ADMIN_USERNAME: 'smoke-admin',
		HDB_ADMIN_PASSWORD: 'smoke-password',
		ROOTPATH: rootPath,
		HTTP_PORT: String(httpPort),
		OPERATIONSAPI_NETWORK_PORT: String(opsPort),
	},
	// Own process group so cleanup can kill Harper's worker threads/children along with it.
	detached: true,
	stdio: ['ignore', 'pipe', 'pipe'],
});

let harperOutput = '';
harper.stdout.on('data', (chunk) => (harperOutput += chunk));
harper.stderr.on('data', (chunk) => (harperOutput += chunk));
let harperExited = false;
harper.on('exit', () => (harperExited = true));

function cleanup() {
	try {
		process.kill(-harper.pid, 'SIGTERM');
	} catch {}
	try {
		fs.rmSync(scratchDir, { recursive: true, force: true });
	} catch {}
	try {
		fs.rmSync(resourcePath, { force: true });
	} catch {}
}

async function waitForServer(timeoutMs = 180_000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (harperExited) {
			throw new Error(`Harper exited before the HTTP server came up. Output:\n${harperOutput.slice(-4000)}`);
		}
		try {
			await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	throw new Error(`Harper HTTP server did not come up within ${timeoutMs}ms. Output:\n${harperOutput.slice(-4000)}`);
}

const failures = [];

async function check(name, requestPath, assert) {
	const response = await fetch(baseUrl + requestPath, {
		headers: { Authorization: credentials },
		signal: AbortSignal.timeout(10_000),
	});
	const body = await response.text();
	const problem = assert(response, body);
	if (problem) {
		failures.push(
			`${name}: ${problem}\n  GET ${requestPath} -> ${response.status} ${
				response.headers.get('content-type')
			}\n  body: ${body.slice(0, 200)}`,
		);
		console.error(`✗ ${name}`);
	} else {
		console.log(`✓ ${name}`);
	}
}

try {
	await waitForServer();

	// The regression check: a GET for an exported resource must reach the REST handler and
	// return its JSON — not be swallowed by the static handler and answered with index.html.
	await check('REST resource answers GET with JSON', '/SmokeTestResource/', (response, body) => {
		if (!response.ok) { return `expected 200, got ${response.status}`; }
		if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
			return 'expected an application/json response (static handler likely intercepted the request)';
		}
		try {
			if (JSON.parse(body).smoke !== 'ok') { return 'unexpected response body'; }
		} catch {
			return 'response body is not JSON';
		}
		return null;
	});

	await check('frontend index is served at /', '/', (response, body) => {
		if (!response.ok) { return `expected 200, got ${response.status}`; }
		if (!(response.headers.get('content-type') ?? '').includes('text/html')) {
			return 'expected a text/html response';
		}
		if (!body.toLowerCase().includes('<html')) { return 'response body does not look like an HTML document'; }
		return null;
	});
} catch (error) {
	failures.push(String(error?.message ?? error));
} finally {
	cleanup();
}

if (failures.length > 0) {
	console.error(`\nRuntime smoke test FAILED for ${appDir}:\n\n${failures.join('\n\n')}`);
	process.exit(1);
}
console.log(`\nRuntime smoke test passed for ${appDir}.`);
process.exit(0);
