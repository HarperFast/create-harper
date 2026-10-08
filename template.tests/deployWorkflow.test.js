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

/**
 * The deploy job authenticates with GitHub's OIDC identity token, which the cluster accepts only
 * under a trust policy pinning this repository, `deploy.yaml` on `main`, and the `production`
 * environment (`harper deploy setup=true provider=github-actions`, run as `deploy:setup-ci`).
 */
describe('deploy workflows deploy on merge with OIDC', () => {
	/**
	 * The text of one top-level job, from its key to the next job's.
	 *
	 * @param {string} workflow - The workflow's contents.
	 * @param {string} job - The job's key.
	 * @returns {string} - That job's lines.
	 */
	function jobBlock(workflow, job) {
		const start = workflow.indexOf(`\n  ${job}:\n`);
		expect(start, `job ${job}`).toBeGreaterThan(-1);
		const next = workflow.slice(start + 1).search(/\n {2}[\w-]+:\n/);
		return next === -1 ? workflow.slice(start) : workflow.slice(start, start + 1 + next);
	}

	for (const dir of templateDirs) {
		test(`${dir} tests pull requests and deploys merges to main`, () => {
			const workflow = fs.readFileSync(path.join(root, dir, workflowPath), 'utf-8');

			expect(workflow).toMatch(/\non:\n {2}pull_request:\n {2}push:\n {4}branches: \[main\]\n {2}workflow_dispatch:\n/);
			expect(workflow).not.toContain('tags:');
			expect(jobBlock(workflow, 'deploy')).toContain(
				"if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'",
			);
			expect(jobBlock(workflow, 'deploy')).toContain('environment: production');
		});

		test(`${dir} holds no Harper credential, and only the deploy job may mint an identity token`, () => {
			const workflow = fs.readFileSync(path.join(root, dir, workflowPath), 'utf-8');

			expect(workflow.match(/^ +id-token: write$/gm)).toHaveLength(1);
			expect(jobBlock(workflow, 'deploy')).toContain('id-token: write');
			expect(workflow).toMatch(/\npermissions:\n {2}contents: read\n/);
			expect(workflow).toContain('HARPER_CLI_TARGET: ${{ vars.HARPER_CLI_TARGET }}');
			expect(workflow).not.toContain('HARPER_CLI_REFRESH_TOKEN');
			expect(workflow).not.toContain('secrets.');
			// The deploy uploads the checkout, `.git` included, so the job's token must not be in it.
			expect(jobBlock(workflow, 'deploy')).toContain('persist-credentials: false');
		});

		test(`${dir} deploys an explicit project and waits for the rolling job`, () => {
			const deploy = jobBlock(fs.readFileSync(path.join(root, dir, workflowPath), 'utf-8'), 'deploy');

			expect(deploy).toContain('[ -n "$HARPER_CLI_TARGET" ] ||');
			expect(deploy).toContain(
				'harper deploy project=your-component-name-here restart=rolling json=true > "$RUNNER_TEMP/deploy.json"',
			);
			expect(deploy).toContain('npm install --global harper@^5.3');
			// A rolling deploy with no job id must fail, not pass unverified.
			expect(deploy).toContain(
				'[ -n "$JOB_ID" ] || { echo "::error::The rolling deploy returned no restartJobId"; exit 1; }',
			);
			expect(deploy).toContain('harper get_job id="$JOB_ID" json=true > "$RUNNER_TEMP/job.json" || continue');
		});

		// A run whose tests finished late must not deploy over a newer commit.
		test(`${dir} skips a run that main has moved past`, () => {
			const deploy = jobBlock(fs.readFileSync(path.join(root, dir, workflowPath), 'utf-8'), 'deploy');

			expect(deploy).toContain('HEAD=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_REF_NAME" --jq .sha)');
			const gated = deploy.split('\n      - name: ').slice(2);
			expect(gated.length).toBeGreaterThan(0);
			for (const step of gated) {
				if (step.startsWith('your-package-manager') || !step.includes('\n')) { continue; }
				expect(step, step.split('\n')[0]).toMatch(
					/if: (\$\{\{ !cancelled\(\) && )?steps\.current\.outputs\.deploy == 'true'/,
				);
			}
		});

		test(`${dir} pins the actions this repository's own CI uses`, () => {
			const workflow = fs.readFileSync(path.join(root, dir, workflowPath), 'utf-8');

			expect(workflow).not.toMatch(/actions\/checkout@\S+ # v6/);
			expect(workflow).toContain('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1');
			expect(workflow).toContain('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0');
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

		expect(workflow).not.toContain('npm ci');
		expect(workflow).not.toContain("cache: 'npm'");
		// The Harper CLI is the one deliberate npm holdout.
		expect(workflow).toContain('run: npm install --global harper@');

		// No placeholder may survive into a scaffolded project.
		expect(workflow).not.toContain('your-package-manager');
	});

	test('bun gets a Bun setup and no setup-node cache, which supports npm/Yarn/pnpm only', () => {
		const workflow = scaffoldFor('vanilla', 'bun', '1.2.19');

		expect(workflow).toContain('- name: Set up Bun');
		expect(workflow).toContain('uses: oven-sh/setup-bun@');
		expect(workflow).toContain('bun-version: 1.2.19');
		expect(workflow).toContain('run: bun install --frozen-lockfile');
		expect(workflow).toContain('run: bun run test');

		expect(workflow).not.toMatch(/cache: '/);
		expect(workflow).not.toContain('your-package-manager');
	});

	test('deno runs package.json scripts as tasks', () => {
		const workflow = scaffoldFor('vanilla', 'deno', '2.5.0');

		expect(workflow).toContain('- name: Set up Deno');
		expect(workflow).toContain('run: deno install --frozen');
		expect(workflow).toContain('run: deno task test');
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

	// The project name comes from the directory, which may hold spaces or shell syntax, and it is
	// substituted into shell commands: only a component name may reach them.
	test('a project name with shell syntax deploys as a sanitized component name', () => {
		const target = path.join(tempDir, 'shell-syntax');
		scaffoldProject(target, 'my app; printf X', 'my-app', 'vanilla', undefined, 'npm', '10.9.0');
		const workflow = fs.readFileSync(path.join(target, '.github', 'workflows', 'deploy.yaml'), 'utf-8');
		const pkgJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf-8'));

		expect(workflow).toContain('harper deploy project=my-app-printf-X restart=rolling');
		expect(workflow).not.toContain('; printf X');
		expect(pkgJson.scripts.deploy).toBe('harper deploy project=my-app-printf-X restart=rolling');
		expect(pkgJson.scripts['deploy:setup-ci']).toBe(
			'harper deploy setup=true provider=github-actions project=my-app-printf-X',
		);
	});

	test('npm still gets the npm workflow', () => {
		const workflow = scaffoldFor('vanilla', 'npm', '10.9.0');

		expect(workflow).toContain("cache: 'npm'");
		expect(workflow).toContain('run: npm ci');
		expect(workflow).toContain('run: npm run test');
		expect(workflow).not.toContain('your-package-manager');
	});

	// The Next.js templates keep their own copy of the workflow, which builds before it deploys, so
	// it needs the same treatment rather than inheriting it from the fan-out.
	test('the standalone Next.js workflow follows the package manager too', () => {
		const workflow = scaffoldFor('nextjs', 'pnpm', '11.17.0');

		expect(workflow).toContain('harper deploy project=test-project restart=rolling');
		expect(workflow).toContain('- name: Set up pnpm');
		expect(workflow).toContain("cache: 'pnpm'");
		expect(workflow).toContain('run: pnpm install --frozen-lockfile');
		expect(workflow).toContain('run: pnpm run build');

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
