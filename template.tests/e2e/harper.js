/**
 * Boots an isolated Harper instance for end-to-end testing of a generated app.
 *
 * This is the shared core used by both the quick `runtimeSmoke.js` and the full Playwright
 * e2e suite. It encodes the isolation recipe Harper needs to run throwaway instances:
 *
 *   - HOME points at a scratch dir so Harper can't find (or clobber) a real installation's
 *     boot-properties file, guaranteeing a fresh, isolated install.
 *   - ROOTPATH lives under /tmp with a short name: Harper's operations server listens on a unix
 *     domain socket inside ROOTPATH, and socket paths are capped at ~104 chars on macOS.
 *   - A throwaway admin user is created from HDB_ADMIN_USERNAME/PASSWORD.
 *   - Harper runs in its own process group (detached) so cleanup can kill the whole tree.
 *
 * The Harper version under test is whatever the `harperBin` resolves to — set HARPER_BIN to a
 * specific install to pin the version (see template.tests/e2e/run.js).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** The throwaway superuser created for every isolated instance. */
export const DEFAULT_CREDENTIALS = { username: 'smoke-admin', password: 'smoke-password' };

/** Build a Basic auth header value for the given credentials. */
export function authHeader(credentials = DEFAULT_CREDENTIALS) {
	return `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Boot Harper against the given app directory and wait until the HTTP server accepts
 * connections. The instance is NOT yet guaranteed to accept authenticated requests — call
 * `waitUntilReady(authGatedPath)` before exercising resources (see the note on that method).
 *
 * @param {object} options
 * @param {string} options.appDir - Directory containing the app's config.yaml.
 * @param {string} [options.harperBin] - Path to the harper CLI (defaults to HARPER_BIN or `harper`).
 * @param {number} [options.httpPort]
 * @param {number} [options.opsPort]
 * @param {{username: string, password: string}} [options.credentials]
 * @param {(chunk: string) => void} [options.onLog] - Receives Harper's stdout/stderr as it arrives.
 * @param {() => void} [options.onStop] - Extra caller cleanup run by stop() (and on interrupt),
 *   after Harper is killed and before the scratch dir is removed.
 * @returns {Promise<{
 *   baseUrl: string, opsUrl: string, credentials: object, authorization: string,
 *   stop: () => void, waitUntilReady: (probePath: string, timeoutMs?: number) => Promise<void>,
 *   tail: () => string,
 * }>}
 */
export async function bootHarper({
	appDir,
	harperBin = process.env.HARPER_BIN ?? 'harper',
	httpPort = Number(process.env.SMOKE_HTTP_PORT ?? 19926),
	opsPort = Number(process.env.SMOKE_OPS_PORT ?? 19925),
	credentials = DEFAULT_CREDENTIALS,
	onLog,
	onStop,
} = {}) {
	if (!appDir || !fs.existsSync(path.join(appDir, 'config.yaml'))) {
		throw new Error(`bootHarper: appDir must contain a config.yaml (got ${appDir})`);
	}

	const scratchDir = fs.mkdtempSync('/tmp/harper-e2e-');
	const rootPath = path.join(scratchDir, 'hdb');
	const homeDir = path.join(scratchDir, 'home');
	fs.mkdirSync(rootPath);
	fs.mkdirSync(homeDir);

	const baseUrl = `http://127.0.0.1:${httpPort}`;
	const opsUrl = `http://127.0.0.1:${opsPort}`;
	const authorization = authHeader(credentials);

	let output = '';
	const record = (chunk) => {
		output += chunk;
		onLog?.(String(chunk));
	};
	const tail = () => output.slice(-4000);

	// HARPER_BIN can be an installed executable (`harper` on PATH, or a package's .bin/harper) or
	// a raw built entrypoint from a source build (dist/bin/harper.js), which has no guaranteed
	// executable bit — launch the latter through node.
	const [command, commandArgs] = harperBin.endsWith('.js')
		? [process.execPath, [harperBin, 'run', appDir]]
		: [harperBin, ['run', appDir]];

	const harper = spawn(command, commandArgs, {
		env: {
			...process.env,
			HOME: homeDir,
			TC_AGREEMENT: 'yes',
			HDB_ADMIN_USERNAME: credentials.username,
			HDB_ADMIN_PASSWORD: credentials.password,
			ROOTPATH: rootPath,
			HTTP_PORT: String(httpPort),
			OPERATIONSAPI_NETWORK_PORT: String(opsPort),
		},
		detached: true,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	harper.stdout.on('data', record);
	harper.stderr.on('data', record);

	let exited = false;
	harper.on('exit', () => (exited = true));
	// Without an 'error' listener a failed spawn (e.g. harper not on PATH) throws unhandled and
	// skips cleanup entirely.
	harper.on('error', (error) => {
		record(`\nFailed to spawn ${harperBin}: ${error.message}\n`);
		exited = true;
	});

	function stop() {
		// Detach the interrupt handlers first so stop() is idempotent and repeated boots don't
		// accumulate process listeners.
		process.removeListener('SIGINT', onSignal);
		process.removeListener('SIGTERM', onSignal);
		try {
			// Harper runs in its own process group (detached), so it outlives this process unless
			// killed explicitly — negative pid targets the whole group.
			if (harper.pid) {
				process.kill(-harper.pid, 'SIGTERM');
			}
		} catch {}
		try {
			onStop?.();
		} catch {}
		try {
			fs.rmSync(scratchDir, { recursive: true, force: true });
		} catch {}
	}

	// An interrupted parent (Ctrl+C, CI cancellation) would otherwise leave the detached Harper
	// orphaned and holding its ports. Kill it, then exit with the conventional signal code.
	function onSignal(signal) {
		stop();
		process.exit(signal === 'SIGINT' ? 130 : 143);
	}
	process.on('SIGINT', onSignal);
	process.on('SIGTERM', onSignal);

	async function waitForHttp(timeoutMs = 180_000) {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			if (exited) {
				throw new Error(`Harper exited before the HTTP server came up. Output:\n${tail()}`);
			}
			try {
				await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
				return;
			} catch {
				await sleep(1000);
			}
		}
		throw new Error(`Harper HTTP server did not come up within ${timeoutMs}ms. Output:\n${tail()}`);
	}

	/**
	 * Wait until an authenticated GET of `probePath` returns a 2xx.
	 *
	 * The HTTP port answers `/` (and returns 401 for auth-gated routes) before the user/role
	 * store finishes loading, so a plain response is not "ready" — a request that races install
	 * completion comes back 401. Poll an auth-gated path (a resource or exported table) until it
	 * succeeds. Passing a non-auth-gated path (like `/` on a template that serves a frontend
	 * without auth) would return immediately and defeat the purpose.
	 */
	async function waitUntilReady(probePath, timeoutMs = 90_000) {
		const deadline = Date.now() + timeoutMs;
		let last = 'no response';
		while (Date.now() < deadline) {
			if (exited) {
				throw new Error(`Harper exited before it was ready. Output:\n${tail()}`);
			}
			try {
				const response = await fetch(baseUrl + probePath, {
					headers: { Authorization: authorization, Accept: 'application/json' },
					signal: AbortSignal.timeout(5000),
				});
				if (response.ok) {
					return;
				}
				last = `GET ${probePath} -> ${response.status}`;
			} catch (error) {
				last = error.message;
			}
			await sleep(500);
		}
		throw new Error(`Harper was not ready within ${timeoutMs}ms (${last}). Output:\n${tail()}`);
	}

	try {
		await waitForHttp();
	} catch (error) {
		// Don't leak the spawned (detached) Harper process if it never came up.
		stop();
		throw error;
	}
	return { baseUrl, opsUrl, credentials, authorization, stop, waitUntilReady, tail };
}
