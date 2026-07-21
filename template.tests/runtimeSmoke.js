#!/usr/bin/env node
/**
 * Runtime smoke test for a generated template application — the fast check that runs on every PR.
 *
 * Boots the app under a real Harper instance (isolated root, throwaway admin user) and verifies
 * the HTTP surface every template must provide:
 *
 *   1. REST resources are reachable over GET — a `resources/` class must answer with JSON.
 *      This is the regression check for the static `notFound`/`fallthrough: false` catch-all,
 *      which ran before the REST handler and answered resource GETs with index.html.
 *   2. The frontend is served — `GET /` returns the app's HTML.
 *
 * For the fuller, version-parameterized end-to-end suite (schema CRUD, custom resources, and a
 * frontend component that consumes the API in a browser), see template.tests/e2e/.
 *
 * Usage: node template.tests/runtimeSmoke.js <app-dir>
 *
 * The app must already be installed (and built, for templates with a build step). Requires the
 * `harper` CLI on PATH (or set HARPER_BIN). POSIX only. Ports override via SMOKE_HTTP_PORT /
 * SMOKE_OPS_PORT.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bootHarper } from './e2e/harper.js';

const appDir = process.argv[2] && path.resolve(process.argv[2]);
if (!appDir || !fs.existsSync(path.join(appDir, 'config.yaml'))) {
	console.error('Usage: node template.tests/runtimeSmoke.js <app-dir> (must contain a config.yaml)');
	process.exit(2);
}

// The REST resource the test queries. Written into the app like a user would add one; the
// extension must match the template's jsResource glob (`resources/*.ts` in TS templates).
const isTypeScript = fs.readFileSync(path.join(appDir, 'config.yaml'), 'utf-8').includes('resources/*.ts');
const resourcePath = path.join(appDir, 'resources', `smokeTestResource.${isTypeScript ? 'ts' : 'js'}`);
fs.mkdirSync(path.dirname(resourcePath), { recursive: true });
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

const harper = await bootHarper({ appDir, onLog: (chunk) => process.stdout.write(chunk) });

function cleanup() {
	harper.stop();
	try {
		fs.rmSync(resourcePath, { force: true });
	} catch {}
}
process.on('SIGINT', () => {
	cleanup();
	process.exit(130);
});
process.on('SIGTERM', () => {
	cleanup();
	process.exit(143);
});

const failures = [];

async function check(name, requestPath, assert) {
	let problem;
	try {
		const response = await fetch(harper.baseUrl + requestPath, {
			headers: { Authorization: harper.authorization },
			signal: AbortSignal.timeout(10_000),
		});
		const body = await response.text();
		problem = assert(response, body);
		if (problem) {
			problem += `\n  GET ${requestPath} -> ${response.status} ${response.headers.get('content-type')}\n  body: ${
				body.slice(0, 200)
			}`;
		}
	} catch (error) {
		// A request-level failure shouldn't abort the remaining checks.
		problem = `GET ${requestPath} failed: ${error.message}`;
	}
	if (problem) {
		failures.push(`${name}: ${problem}`);
		console.error(`✗ ${name}`);
	} else {
		console.log(`✓ ${name}`);
	}
}

try {
	// The HTTP port answers before the auth store is ready; wait until an authenticated GET of
	// the injected resource succeeds before asserting.
	await harper.waitUntilReady('/SmokeTestResource/');

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
