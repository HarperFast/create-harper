import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { scaffoldProject } from '../lib/steps/scaffoldProject.js';

// Scaffolding narrates every file it writes; the assertions below care about the files, not the
// narration. The CLI runs out of process, so this only quiets the in-process calls.
vi.mock('@clack/prompts');

const root = path.resolve(import.meta.dirname, '..');
const cliPath = path.resolve(root, 'index.js');
const workflowPath = path.join('_github', 'workflows', 'deploy.yaml');

// Every template that ships a deploy workflow. template-early-hints deliberately ships none — it
// is a legacy `harperdb` EdgeWorker example, excluded from the deploy migration.
const templateDirs = fs.readdirSync(root)
	.filter((name) => name.startsWith('template-') && fs.existsSync(path.join(root, name, workflowPath)));

/**
 * The deploy workflows must follow the package manager that scaffolded the project. create-harper
 * installs with whichever one invoked it, so a project created by `pnpm create harper` commits
 * `pnpm-lock.yaml` — against which setup-node's npm cache cannot resolve a package lock and
 * `npm ci` fails, killing the job before it ever reaches tests or deploy.
 */
describe('deploy workflows are package-manager agnostic', () => {
	test('finds template deploy workflows to check', () => {
		expect(templateDirs.length).toBeGreaterThan(0);
	});

	for (const dir of templateDirs) {
		test(`${dir} hard-codes no package manager`, () => {
			const workflow = fs.readFileSync(path.join(root, dir, workflowPath), 'utf-8');

			expect(workflow).toContain('# your-package-manager-setup-step-here');
			expect(workflow).toContain('# your-package-manager-node-cache-here');
			expect(workflow).toContain('run: your-package-manager-install-here');

			expect(workflow).not.toContain('npm ci');
			expect(workflow).not.toMatch(/cache: '/);
			// `npm install -g harper` stays npm on purpose — it is a global tool, and npm always
			// comes with the Node.js the workflow sets up. Running a package.json script must not.
			expect(workflow).not.toContain('npm run');
			expect(workflow).not.toContain('npm test');
		});
	}
});

describe('generated deploy workflows', () => {
	/** @type {string} */
	let tempDir;

	/**
	 * Scaffolds a template for the given package manager and reads back the deploy workflow.
	 *
	 * @param {string} template - The template name to scaffold.
	 * @param {string} agent - The package manager to scaffold for.
	 * @param {string} [version] - That package manager's version.
	 * @returns {string} - The generated workflow's contents.
	 */
	function scaffoldFor(template, agent, version) {
		const target = path.join(tempDir, `${template}-${agent}`);
		scaffoldProject(target, 'test-project', 'test-project', template, undefined, agent, version);
		return fs.readFileSync(path.join(target, '.github', 'workflows', 'deploy.yaml'), 'utf-8');
	}

	beforeAll(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-harper-deploy-workflow-'));
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterAll(() => {
		vi.restoreAllMocks();
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test('pnpm gets a pinned pnpm setup, a pnpm cache, and pnpm commands', () => {
		const workflow = scaffoldFor('vanilla', 'pnpm', '11.17.0');

		expect(workflow).toContain('- name: Set up pnpm');
		expect(workflow).toContain('uses: pnpm/action-setup@');
		expect(workflow).toContain('version: 11.17.0');
		expect(workflow).toContain("cache: 'pnpm'");
		expect(workflow).toContain('run: pnpm install --frozen-lockfile');
		expect(workflow).toContain('run: pnpm run test');
		expect(workflow).toContain('run: pnpm run deploy');

		expect(workflow).not.toContain('npm ci');
		expect(workflow).not.toContain("cache: 'npm'");
		// The Harper CLI is the one deliberate npm holdout.
		expect(workflow).toContain('run: npm install -g harper@');

		// No placeholder may survive into a scaffolded project.
		expect(workflow).not.toContain('your-package-manager');
	});

	test('bun gets a Bun setup and no setup-node cache, which supports npm/Yarn/pnpm only', () => {
		const workflow = scaffoldFor('vanilla', 'bun', '1.2.19');

		expect(workflow).toContain('- name: Set up Bun');
		expect(workflow).toContain('uses: oven-sh/setup-bun@');
		expect(workflow).toContain('bun-version: 1.2.19');
		expect(workflow).toContain('run: bun install --frozen-lockfile');
		expect(workflow).toContain('run: bun run deploy');

		expect(workflow).not.toMatch(/cache: '/);
		expect(workflow).not.toContain('your-package-manager');
	});

	test('deno runs package.json scripts as tasks', () => {
		const workflow = scaffoldFor('vanilla', 'deno', '2.5.0');

		expect(workflow).toContain('- name: Set up Deno');
		expect(workflow).toContain('run: deno install --frozen');
		expect(workflow).toContain('run: deno task deploy');
		expect(workflow).not.toContain('your-package-manager');
	});

	test('Yarn 2+ (Berry) provisions the detected Yarn via Corepack before installing immutably', () => {
		const workflow = scaffoldFor('vanilla', 'yarn', '4.9.1');

		// Without the Corepack step, `yarn install --immutable` runs under the runner's preinstalled
		// Yarn 1, which rejects `--immutable`. The verify-yarn-berry-install job in integration.yaml
		// runs this exact pair of commands on a real runner to prove they work together.
		expect(workflow).toContain('run: corepack enable && corepack prepare yarn@4.9.1 --activate');
		expect(workflow).toContain('run: yarn install --immutable');
		expect(workflow).not.toContain('--frozen-lockfile');
		expect(workflow).not.toContain('your-package-manager');
	});

	test('Yarn 1 (Classic) is preinstalled, so no Corepack step and the classic lockfile flag', () => {
		const workflow = scaffoldFor('vanilla', 'yarn', '1.22.22');

		expect(workflow).not.toContain('corepack');
		expect(workflow).toContain('run: yarn install --frozen-lockfile');
		expect(workflow).not.toContain('your-package-manager');
	});

	test('npm still gets the npm workflow', () => {
		const workflow = scaffoldFor('vanilla', 'npm', '10.9.0');

		expect(workflow).toContain("cache: 'npm'");
		expect(workflow).toContain('run: npm ci');
		expect(workflow).toContain('run: npm run deploy');
		expect(workflow).not.toContain('your-package-manager');
	});

	// The Next.js templates keep their own payload-deploy workflow instead of the shared
	// by-reference one, so it needs the same treatment rather than inheriting it from the fan-out.
	test('the standalone Next.js payload workflow follows the package manager too', () => {
		const workflow = scaffoldFor('nextjs', 'pnpm', '11.17.0');

		expect(workflow).toContain('harper deploy_component');
		expect(workflow).toContain('- name: Set up pnpm');
		expect(workflow).toContain("cache: 'pnpm'");
		expect(workflow).toContain('run: pnpm install --frozen-lockfile');
		expect(workflow).toContain('run: pnpm run deploy');

		expect(workflow).not.toContain('npm ci');
		expect(workflow).not.toContain('your-package-manager');
	});
});

describe('the invoking package manager reaches the generated workflow', () => {
	/** @type {string} */
	let tempDir;

	beforeAll(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-harper-user-agent-'));
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
		fs.mkdirSync(tempDir, { recursive: true });
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	// End to end through the CLI, so the `npm_config_user_agent` plumbing is covered too and not
	// just the substitution it feeds.
	test('`pnpm create harper` produces a pnpm workflow', () => {
		const projectName = 'test-user-agent';

		// Windows matches environment variable names case-insensitively, so the
		// `npm_config_user_agent` npm set when it ran this test suite can survive alongside the one
		// set here and win. Drop every casing of it before setting ours.
		const env = Object.fromEntries(
			Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'npm_config_user_agent'),
		);

		const result = spawnSync('node', [
			cliPath,
			projectName,
			'--template',
			'vanilla',
			'--no-interactive',
			'--overwrite',
		], {
			cwd: tempDir,
			env: {
				...env,
				_HARPER_TEST_CLI: '1',
				CREATE_HARPER_SKIP_UPDATE: '1',
				npm_config_user_agent: 'pnpm/11.17.0 npm/? node/v22.0.0 linux x64',
			},
			encoding: 'utf-8',
		});

		if (result.status !== 0) {
			console.error(result.stderr);
			console.log(result.stdout);
		}
		expect(result.status).toBe(0);

		// Checked first, and against the CLI's own account of what it detected, so a failure here
		// separates "the user agent never reached the child" from "the workflow came out wrong".
		expect(result.stdout, `CLI output was:\n${result.stdout}`).toContain('dependencies with pnpm');

		const workflow = fs.readFileSync(
			path.join(tempDir, projectName, '.github', 'workflows', 'deploy.yaml'),
			'utf-8',
		);

		expect(workflow).toContain('run: pnpm install --frozen-lockfile');
		expect(workflow).toContain('version: 11.17.0');
		expect(workflow).not.toContain('npm ci');
	});
});
