#!/usr/bin/env node
/**
 * Runtime smoke test for a generated Next.js-on-Harper template application.
 *
 * The `@harperfast/nextjs` plugin owns HTTP routing, so these apps don't expose the REST resource
 * surface that runtimeSmoke.js checks. The templates ship `prebuilt: true`, so `harper run` serves
 * a prebuilt `.next` rather than building on startup (an on-cluster build currently fails —
 * @harperfast/nextjs#57 and #58). This smoke mirrors the real deploy flow: it builds the app (if it
 * isn't already built), then boots it under a real Harper instance (isolated root, throwaway admin
 * user, multi-threaded) and verifies the two things every Next.js template must do:
 *
 *   1. The app serves — `GET /` returns HTML rendering the Harper-backed counter (a server
 *      component reading the Count table). A missing or broken prebuilt leaves the plugin unable to
 *      serve, and this catches that.
 *   2. The write path works — invoking the increment server action (transaction + addTo) advances
 *      the persisted count, verified by a fresh reload. GET-only would still pass if the write half
 *      were broken.
 *
 * Usage: node template.tests/nextSmoke.js <app-dir>
 *
 * The app must already be installed (this script runs `next build` if `.next` is absent). Requires
 * the `harper` CLI on PATH (or set HARPER_BIN). POSIX only. Ports override via SMOKE_HTTP_PORT /
 * SMOKE_OPS_PORT.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const appDir = process.argv[2] && path.resolve(process.argv[2]);
if (!appDir || !fs.existsSync(path.join(appDir, 'config.yaml'))) {
	console.error('Usage: node template.tests/nextSmoke.js <app-dir> (must contain a config.yaml)');
	process.exit(2);
}

// The templates ship `prebuilt: true`: `harper run` serves an existing `.next` and refuses to build
// on startup, so make sure the app is built first. Skip when it already is (CI runs the template's
// `build` script before this smoke); otherwise build here so the script also works standalone.
if (!fs.existsSync(path.join(appDir, '.next', 'BUILD_ID'))) {
	console.log('No prebuilt .next found — running `next build`...');
	const nextBin = path.join(appDir, 'node_modules', '.bin', 'next');
	const build = spawnSync(nextBin, ['build'], { cwd: appDir, stdio: 'inherit', env: process.env });
	if (build.status !== 0) {
		console.error('`next build` failed; cannot run the prebuilt smoke.');
		process.exit(1);
	}
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

// Pull the counter value out of the rendered HTML ("count is <n>"; React can split that text node).
function parseCount(html) {
	const m = html.replace(/<[^>]+>/g, '').match(/count is\s*(\d+)/i);
	return m ? Number(m[1]) : null;
}

try {
	await waitForServer();

	// 1. The app builds + serves, and the home page renders the Harper-backed counter (a server
	//    component reading the Count table).
	const response = await fetch(baseUrl + '/', { signal: AbortSignal.timeout(10_000) });
	const html = await response.text();
	const contentType = response.headers.get('content-type') ?? '';
	const countBefore = parseCount(html);
	// Next renders `<form action={serverAction}>` with a hidden `$ACTION_ID_<hash>` field; posting it
	// as multipart/form-data is the no-JS progressive-enhancement path that invokes the server action.
	const actionField = html.match(/name="(\$ACTION_ID_[a-f0-9]+)"/)?.[1];

	if (!response.ok) {
		failures.push(`expected 200 from GET /, got ${response.status} (build likely failed → not served)`);
	} else if (!contentType.includes('text/html')) {
		failures.push(`expected a text/html response from GET /, got ${contentType}`);
	} else if (!html.toLowerCase().includes('<html')) {
		failures.push('GET / response does not look like an HTML document');
	} else if (countBefore === null) {
		// The count is read from the Count table in a server action; its absence means the
		// server-side Harper read failed.
		failures.push('GET / HTML is missing the counter ("count is <n>") — server-side table read may have failed');
	} else if (!actionField) {
		failures.push("GET / HTML is missing the increment form's server-action field");
	} else {
		console.log(`✓ app builds, serves, and renders the counter (count is ${countBefore})`);

		// 2. Exercise the write half end to end: invoke the increment server action, then confirm a
		//    fresh reload reflects the persisted, incremented value (transaction + addTo + revalidate).
		const form = new FormData();
		form.append(actionField, '');
		const post = await fetch(baseUrl + '/', { method: 'POST', body: form, signal: AbortSignal.timeout(15_000) });
		if (!post.ok) {
			failures.push(`increment server action POST failed: ${post.status}`);
		} else {
			const reload = await fetch(baseUrl + '/', { signal: AbortSignal.timeout(10_000) });
			const countAfter = parseCount(await reload.text());
			if (countAfter === countBefore + 1) {
				console.log(`✓ increment server action advances the persisted count (${countBefore} → ${countAfter})`);
			} else {
				failures.push(
					`increment did not advance the count on reload: ${countBefore} → ${countAfter} `
						+ '(server action, transaction/addTo, or revalidation may be broken)',
				);
			}
		}
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
