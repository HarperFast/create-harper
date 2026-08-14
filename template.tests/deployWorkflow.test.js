import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

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

describe('scaffolding with a non-npm package manager', () => {
	/** @type {string} */
	let tempDir;

	/**
	 * Scaffolds a template as the given package manager would, and reads back the deploy workflow
	 * it generated.
	 *
	 * @param {string} template - The template name to scaffold.
	 * @param {string} userAgent - The `npm_config_user_agent` to scaffold under.
	 * @returns {string} - The generated workflow's contents.
	 */
	function scaffold(template, userAgent) {
		const projectName = `test-${template}-${userAgent.replace(/\W/g, '-')}`;

		const result = spawnSync('node', [
			cliPath,
			projectName,
			'--template',
			template,
			'--no-interactive',
			'--overwrite',
		], {
			cwd: tempDir,
			env: {
				...process.env,
				_HARPER_TEST_CLI: '1',
				CREATE_HARPER_SKIP_UPDATE: '1',
				npm_config_user_agent: userAgent,
			},
			encoding: 'utf-8',
		});

		if (result.status !== 0) {
			console.error(result.stderr);
			console.log(result.stdout);
		}
		expect(result.status).toBe(0);

		return fs.readFileSync(
			path.join(tempDir, projectName, '.github', 'workflows', 'deploy.yaml'),
			'utf-8',
		);
	}

	beforeAll(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-harper-deploy-workflow-'));
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test('pnpm gets a pinned pnpm setup, a pnpm cache, and pnpm commands', () => {
		const workflow = scaffold('vanilla', 'pnpm/11.17.0 node/v22.0.0 darwin arm64');

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
		const workflow = scaffold('vanilla', 'bun/1.2.19 node/v22.0.0 darwin arm64');

		expect(workflow).toContain('- name: Set up Bun');
		expect(workflow).toContain('uses: oven-sh/setup-bun@');
		expect(workflow).toContain('bun-version: 1.2.19');
		expect(workflow).toContain('run: bun install --frozen-lockfile');
		expect(workflow).toContain('run: bun run deploy');

		expect(workflow).not.toMatch(/cache: '/);
		expect(workflow).not.toContain('your-package-manager');
	});

	// The Next.js templates keep their own payload-deploy workflow instead of the shared
	// by-reference one, so it needs the same treatment rather than inheriting it from the fan-out.
	test('the standalone Next.js payload workflow follows the package manager too', () => {
		const workflow = scaffold('nextjs', 'pnpm/11.17.0 node/v22.0.0 darwin arm64');

		expect(workflow).toContain('harper deploy_component');
		expect(workflow).toContain('- name: Set up pnpm');
		expect(workflow).toContain("cache: 'pnpm'");
		expect(workflow).toContain('run: pnpm install --frozen-lockfile');
		expect(workflow).toContain('run: pnpm run deploy');

		expect(workflow).not.toContain('npm ci');
		expect(workflow).not.toContain('your-package-manager');
	});
});
