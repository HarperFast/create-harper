#!/usr/bin/env node
/**
 * End-to-end runner for a single template against a chosen Harper version.
 *
 * One code path for both local dev and CI:
 *   1. Generate the app with the real create-harper CLI (into a throwaway temp dir).
 *   2. Overlay e2e fixtures (schema + custom resource + a frontend component).
 *   3. npm install the app.
 *   4. Resolve the Harper CLI (how the version under test is pinned; nothing is installed
 *      globally), in precedence order:
 *        - HARPER_BIN if set                 — reuse an existing install/build.
 *        - --harper-ref <sha|branch|tag>     — clone harperfast/harper, npm install + build from
 *                                              source, and use dist/bin/harper.js. This runs an
 *                                              UNPUBLISHED Harper straight from a commit.
 *        - --harper <spec> (default latest)  — npm install harper@<spec> into an isolated prefix
 *                                              (any npm spec: latest, next, 5.2.0-beta.1, ...).
 *   5. Build the app if it has a build script.
 *   6. Run Playwright (boots Harper, seeds data, exercises the HTTP + browser scenarios).
 *
 * Usage:
 *   node template.tests/e2e/run.js --template react-ts [--harper next] [--keep]
 *   node template.tests/e2e/run.js --template react-ts --harper-ref 1e1edc6   # build from a commit
 *   HARPER_BIN=/path/to/harper node template.tests/e2e/run.js --template vue   # reuse an install
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { templateNames } from '../../lib/constants/templates.js';
import { applyOverlay } from './overlay.js';

const e2eDir = path.resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = path.resolve(e2eDir, '..', '..');

const options = parseArgs(process.argv.slice(2));
if (!options.template || !templateNames.includes(options.template)) {
	console.error(
		`Usage: node template.tests/e2e/run.js --template <${
			templateNames.join(' | ')
		}> [--harper <spec> | --harper-ref <sha|branch|tag>] [--keep]`,
	);
	process.exit(2);
}

const httpPort = process.env.SMOKE_HTTP_PORT ?? '19926';
const opsPort = process.env.SMOKE_OPS_PORT ?? '19925';
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cha-e2e-'));
const appDir = path.join(workDir, `e2e-${options.template}`);

let harperPrefix;
let harperSrc;
let failed = false;
try {
	// 1. Generate with the real CLI.
	sh(
		'node',
		[
			path.join(repoRoot, 'index.js'),
			`e2e-${options.template}`,
			'--template',
			options.template,
			'--no-interactive',
			'--overwrite',
			'--skip-install',
		],
		workDir,
		{ CREATE_HARPER_SKIP_UPDATE: '1', _HARPER_TEST_CLI: '1' },
	);

	// 2. Overlay fixtures.
	const cap = applyOverlay(appDir, options.template);
	console.log(`\nOverlay applied for ${options.template}: ${JSON.stringify(cap)}`);

	// 3. Install app dependencies.
	sh('npm', ['install', '--no-audit', '--no-fund'], appDir);

	// 4. Resolve the Harper CLI (see the precedence order in the file header).
	let harperBin = process.env.HARPER_BIN;
	if (harperBin) {
		console.log(`\nUsing HARPER_BIN=${harperBin}`);
	} else if (options.harperRef) {
		harperSrc = fs.mkdtempSync(path.join(os.tmpdir(), 'cha-harper-src-'));
		console.log(`\nBuilding Harper from ${options.harperRepo} @ ${options.harperRef}`);
		sh('git', ['init', '-q'], harperSrc);
		sh('git', ['remote', 'add', 'origin', options.harperRepo], harperSrc);
		// A shallow fetch of the exact ref — GitHub allows fetching an arbitrary commit sha, so
		// this works for a sha, branch, or tag without cloning the whole history.
		sh('git', ['fetch', '--depth', '1', 'origin', options.harperRef], harperSrc);
		sh('git', ['checkout', '-q', 'FETCH_HEAD'], harperSrc);
		// Full install (with scripts) so native addons (lmdb, argon2, ...) are built for running.
		sh('npm', ['install', '--no-audit', '--no-fund'], harperSrc);
		// The `build` script is `tsc`, used as a type-check, and Harper's `main` isn't always
		// type-green — but tsc still EMITS dist/ on type errors. Harper's own release build
		// (build-tools/build.sh) runs `npm run build || true` for exactly this reason, so tolerate
		// a non-zero exit and instead require that the entrypoint was emitted.
		sh('npm', ['run', 'build'], harperSrc, undefined, { check: false });
		harperBin = path.join(harperSrc, 'dist', 'bin', 'harper.js');
		if (!fs.existsSync(harperBin)) {
			throw new Error(
				`Harper build did not emit ${harperBin} — tsc may be set to noEmitOnError, or the bin layout changed.`,
			);
		}
	} else {
		harperPrefix = fs.mkdtempSync(path.join(os.tmpdir(), 'cha-harper-'));
		sh('npm', ['init', '-y'], harperPrefix);
		sh('npm', ['install', '--no-audit', '--no-fund', `harper@${options.harper}`], harperPrefix);
		harperBin = path.join(harperPrefix, 'node_modules', '.bin', 'harper');
	}

	// 5. Build if the template has a build step (Vite templates do; vanilla doesn't).
	const pkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf-8'));
	if (pkg.scripts?.build) {
		sh('npm', ['run', 'build'], appDir);
	}

	// 6. Exercise it.
	if (cap.browser) {
		// --with-deps pulls the OS libraries Chromium needs on CI runners; skip it locally.
		const withDeps = process.env.CI ? ['--with-deps'] : [];
		sh('npx', ['playwright', 'install', ...withDeps, 'chromium'], repoRoot);
	}
	sh('npx', ['playwright', 'test', '--config', path.join(e2eDir, 'playwright.config.js')], repoRoot, {
		E2E_APP_DIR: appDir,
		E2E_TEMPLATE: options.template,
		E2E_BROWSER: cap.browser ? '1' : '0',
		E2E_SSR: cap.ssr ? '1' : '0',
		HARPER_BIN: harperBin,
		SMOKE_HTTP_PORT: httpPort,
		SMOKE_OPS_PORT: opsPort,
	});
} catch (error) {
	failed = true;
	console.error(`\nE2E failed for ${options.template}: ${error.message}`);
} finally {
	if (options.keep) {
		console.log(`\n--keep: left the generated app at ${appDir}`);
	} else {
		rmrf(workDir);
		rmrf(harperPrefix);
		rmrf(harperSrc);
	}
}

process.exit(failed ? 1 : 0);

function parseArgs(argv) {
	const options = {
		template: undefined,
		harper: 'latest',
		harperRef: undefined,
		harperRepo: 'https://github.com/harperfast/harper.git',
		keep: false,
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--template' || arg === '-t') {
			options.template = argv[++i];
		} else if (arg === '--harper') {
			options.harper = argv[++i];
		} else if (arg === '--harper-ref') {
			options.harperRef = argv[++i];
		} else if (arg === '--harper-repo') {
			options.harperRepo = argv[++i];
		} else if (arg === '--keep') {
			options.keep = true;
		} else if (!arg.startsWith('-') && !options.template) {
			options.template = arg;
		}
	}
	return options;
}

function sh(command, args, cwd, env, { check = true } = {}) {
	console.log(`\n$ ${command} ${args.join(' ')}${cwd ? `  (cwd: ${cwd})` : ''}`);
	const result = spawnSync(command, args, {
		cwd,
		env: { ...process.env, ...env },
		stdio: 'inherit',
	});
	if (check && result.status !== 0) {
		throw new Error(`\`${command} ${args.join(' ')}\` exited with ${result.status ?? result.signal}`);
	}
	return result.status;
}

function rmrf(dir) {
	if (!dir) {
		return;
	}
	try {
		fs.rmSync(dir, { recursive: true, force: true });
	} catch {}
}
