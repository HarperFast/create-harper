#!/usr/bin/env node
/**
 * Runtime smoke test for a generated Next.js-on-Harper template application.
 *
 * The `@harperfast/nextjs` plugin owns HTTP routing, so these apps don't expose the REST resource
 * surface that runtimeSmoke.js checks. The templates deploy prebuilt (`prebuilt: true` + a `.next`
 * produced by `next build`, which the app's own `build` script runs before this test), so `harper
 * run` serves that build rather than compiling on startup. This variant boots the app under a real
 * Harper instance (isolated root, throwaway admin user) and verifies the two things every Next.js
 * template must do:
 *
 *   1. The prebuilt app is served — `GET /` returns HTML. (If `.next` is missing, or a regression
 *      reintroduces an on-startup build that races across worker threads and fails, the plugin
 *      skips serving and every route 404s; this catches that. Harper runs multi-threaded here on
 *      purpose so that regression would surface.)
 *   2. Server-side Harper access works — the home page reads the `Count` table via a server
 *      action and renders the persisted count, so the HTML contains "count is".
 *
 * Usage: node template.tests/nextSmoke.js <app-dir>
 *
 * The app must already be installed. Requires the `harper` CLI on PATH (or set HARPER_BIN).
 * POSIX only. Ports override via SMOKE_HTTP_PORT / SMOKE_OPS_PORT.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const appDir = process.argv[2] && path.resolve(process.argv[2]);
if (!appDir || !fs.existsSync(path.join(appDir, 'config.yaml'))) {
	console.error('Usage: node template.tests/nextSmoke.js <app-dir> (must contain a config.yaml)');
	process.exit(2);
}

const httpPort = Number(process.env.SMOKE_HTTP_PORT ?? 19926);
const opsPort = Number(process.env.SMOKE_OPS_PORT ?? 19925);
const baseUrl = `http://127.0.0.1:${httpPort}`;

// Harper's operations server listens on a unix domain socket inside ROOTPATH, and socket paths
// are limited to ~104 characters on macOS — so keep the scratch root short and in /tmp.
const scratchDir = fs.mkdtempSync('/tmp/harper-next-smoke-');
const rootPath = path.join(scratchDir, 'hdb');
const homeDir = path.join(scratchDir, 'home');
fs.mkdirSync(rootPath);
fs.mkdirSync(homeDir);

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
harper.on('error', (error) => {
	harperOutput += `\nFailed to spawn ${harperBin}: ${error.message}\n`;
	harperExited = true;
});

function cleanup() {
	try {
		if (harper.pid) {
			process.kill(-harper.pid, 'SIGTERM');
		}
	} catch {}
	try {
		fs.rmSync(scratchDir, { recursive: true, force: true });
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

async function waitForServer(timeoutMs = 300_000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (harperExited) {
			throw new Error(`Harper exited before the HTTP server came up. Output:\n${harperOutput.slice(-4000)}`);
		}
		try {
			const response = await fetch(baseUrl + '/', { signal: AbortSignal.timeout(2000) });
			// The plugin serves once the build finishes; a pre-build request can 404, so wait for 2xx.
			if (response.ok) {
				return;
			}
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 1500));
	}
	throw new Error(`Harper did not serve the app within ${timeoutMs}ms. Output:\n${harperOutput.slice(-4000)}`);
}

const failures = [];

try {
	await waitForServer();

	const response = await fetch(baseUrl + '/', { signal: AbortSignal.timeout(10_000) });
	const body = await response.text();
	const contentType = response.headers.get('content-type') ?? '';
	if (!response.ok) {
		failures.push(`expected 200 from GET /, got ${response.status} (build likely failed → not served)`);
	} else if (!contentType.includes('text/html')) {
		failures.push(`expected an text/html response from GET /, got ${contentType}`);
	} else if (!body.toLowerCase().includes('<html')) {
		failures.push('GET / response does not look like an HTML document');
	} else if (!body.includes('count is')) {
		// The count is read from the Count table in a server action; its absence means the
		// server-side Harper read failed.
		failures.push('GET / HTML is missing the counter ("count is") — server-side table read may have failed');
	}
	if (failures.length === 0) {
		console.log('✓ Next.js app builds, serves, and renders the Harper-backed counter');
	}
} catch (error) {
	failures.push(String(error?.message ?? error));
} finally {
	cleanup();
}

if (failures.length > 0) {
	console.error(`\nNext.js runtime smoke test FAILED for ${appDir}:\n\n${failures.join('\n\n')}`);
	process.exit(1);
}
console.log(`\nNext.js runtime smoke test passed for ${appDir}.`);
process.exit(0);
