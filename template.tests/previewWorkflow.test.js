import spawn from 'cross-spawn';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import * as YAML from 'yaml';
import { scaffoldProject } from '../lib/steps/scaffoldProject.js';
import { checkPreviewWorkflowFile, checkWorkflowFile } from './harper/workflowChecks.ts';

vi.mock('@clack/prompts');

const root = path.resolve(import.meta.dirname, '..');
const deployWorkflowPath = path.join('_github', 'workflows', 'deploy.yaml');
const previewDir = path.join('.github', 'previews');

// A Next.js commit has no `.next`, and building on the cluster fails (HarperFast/nextjs#57, #58).
const templates = fs.readdirSync(root)
	.filter((name) => name.startsWith('template-') && fs.existsSync(path.join(root, name, deployWorkflowPath)))
	.map((name) => name.slice('template-'.length));
const previewTemplates = templates.filter((name) => !name.startsWith('nextjs'));

const packageManagers = [['npm', '10.9.0'], ['pnpm', '11.17.0'], ['yarn', '4.9.1'], ['bun', '1.2.19'], [
	'deno',
	'2.1.0',
]];

// `harper preview setup`'s defaults, which its trust policies pin.
const check = (workflow) => checkPreviewWorkflowFile(workflow, 'main', 'preview', 'preview-cleanup');
const clean = { problems: [], unverified: [], unsafe: [] };
const previewGate = "vars.HARPER_PREVIEW_TARGET != '' && ";

/**
 * A file as a scaffolded project holds it, with LF line endings: a Windows checkout has CRLF.
 *
 * @param {string} project - The scaffolded project's directory.
 * @param {...string} segments - The file's path in the project.
 * @returns {string} - The file's contents.
 */
function readFile(project, ...segments) {
	return fs.readFileSync(path.join(project, ...segments), 'utf-8').replaceAll('\r\n', '\n');
}

/**
 * The preview workflow a scaffolded project holds, before `deploy:setup-previews` puts it in place.
 *
 * @param {string} project - The scaffolded project's directory.
 * @returns {string} - The workflow's contents.
 */
function readPreviewWorkflow(project) {
	return readFile(project, previewDir, 'preview.yaml');
}

/**
 * Runs the step of `deploy:setup-previews` that puts the workflow in place.
 *
 * @param {string} project - The scaffolded project's directory.
 * @param {string} [cwd] - Where to run it from; the project by default.
 * @returns {import('node:child_process').SpawnSyncReturns<string>} - The run's result.
 */
function installWorkflow(project, cwd = project) {
	return spawnSync(process.execPath, [path.join(project, previewDir, 'install-workflow.js')], {
		cwd,
		encoding: 'utf-8',
		timeout: 20_000,
	});
}

// Each test writes a whole project to disk, which a Windows runner has stalled for over 5s.
describe('scaffolded preview workflows', { timeout: 30_000 }, () => {
	/** @type {string} */
	let tempDir;
	/** @type {string} */
	let workflow;

	/**
	 * @param {string} template - The template name to scaffold.
	 * @param {string} agent - The package manager to scaffold for.
	 * @param {string} version - That package manager's version.
	 * @param {string} [name] - The project's directory name, which is also its component name.
	 * @returns {string} - The scaffolded project's directory.
	 */
	function scaffold(template, agent, version, name = `${template}-${agent}`) {
		const target = path.join(tempDir, name);
		scaffoldProject(target, 'shop', 'shop', template, undefined, agent, version);
		return target;
	}

	beforeAll(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-harper-preview-workflow-'));
		workflow = readPreviewWorkflow(scaffold('vanilla', 'npm', '10.9.0'));
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test('finds the templates that preview by reference', () => {
		expect(previewTemplates.length).toBe(10);
	});

	for (const template of previewTemplates) {
		for (const [agent, version] of packageManagers) {
			test(`${template} with ${agent} passes the checks harper runs on both workflows`, () => {
				const project = scaffold(template, agent, version);
				const preview = readPreviewWorkflow(project);

				expect(check(preview)).toEqual(clean);
				expect(checkWorkflowFile(readFile(project, '.github', 'workflows', 'deploy.yaml'), 'main', 'production'))
					.toEqual({
						problems: [],
						unverified: [],
					});
				expect(preview).not.toContain('your-');
				expect(YAML.parse(preview).jobs.deploy.steps[0].with.app).toBe(`${template}-${agent}`);
			});
		}

		test(`${template} has a script that turns previews on`, () => {
			const project = scaffold(template, 'npm', '10.9.0');
			const pkgJson = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf-8'));

			expect(pkgJson.scripts['deploy:setup-previews']).toBe(
				`node .github/previews/install-workflow.js && harper preview setup app=${template}-npm`,
			);
		});

		test(`${template} puts the workflow where GitHub runs it, which setup then checks`, () => {
			const project = scaffold(template, 'npm', '10.9.0', `${template}-install`);
			const installed = path.join(project, '.github', 'workflows', 'preview.yaml');

			expect(fs.existsSync(installed)).toBe(false);
			const result = installWorkflow(project);

			expect(result.status, result.stderr).toBe(0);
			expect(fs.readFileSync(installed, 'utf-8')).toBe(
				fs.readFileSync(path.join(project, previewDir, 'preview.yaml'), 'utf-8'),
			);
			expect(result.stdout).toContain(`Added ${path.join('.github', 'workflows', 'preview.yaml')}.`);
			expect(result.stdout).toContain('Commit it to main only once setup succeeds');
			expect(result.stdout).toContain('allow pull_request_target first');
		});
	}

	test('gates both jobs on the variable setup sets, which is the only one harper reads as set', () => {
		expect(workflow.split(previewGate)).toHaveLength(3);
		expect(check(workflow.replaceAll(previewGate, "vars.OTHER_TARGET != '' && ")).unverified).toEqual([
			'that job "cleanup" runs when a pull request closes, which is what drops its preview before it expires',
		]);
	});

	describe('harper refuses a workflow that gives way', () => {
		const sameRepository = ' && github.event.pull_request.head.repo.full_name == github.repository';

		test('when a job lets forks in', () => {
			expect(check(workflow.replaceAll(sameRepository, '')).problems).toEqual([
				expect.stringContaining('job "deploy" runs for pull requests from forks'),
				expect.stringContaining('job "cleanup" runs for pull requests from forks'),
			]);
		});

		test('when the deploy job checks out the pull request', () => {
			const checkout = [
				'      - uses: actions/checkout@v7',
				'        with:',
				'          ref: ${{ github.event.pull_request.head.sha }}',
				'      - name: Deploy the preview',
			].join('\n');

			expect(check(workflow.replace('      - name: Deploy the preview', checkout)).problems).toEqual([
				expect.stringContaining("checks out the pull request's head"),
			]);
		});

		test('when no job runs in the environment the policy pins', () => {
			expect(check(workflow.replace('environment: preview\n', 'environment: staging\n')).problems).toEqual([
				expect.stringContaining('not "preview"'),
			]);
		});
	});

	test('does nothing until setup sets HARPER_PREVIEW_TARGET', () => {
		for (const job of Object.values(YAML.parse(workflow).jobs)) {
			expect(job.if.startsWith("vars.HARPER_PREVIEW_TARGET != '' && ")).toBe(true);
		}
	});

	test('holds no permission at the top, and gives each job only what the action needs', () => {
		const { permissions, jobs } = YAML.parse(workflow);

		expect(permissions).toEqual({});
		for (const job of Object.values(jobs)) {
			expect(job.permissions).toEqual({ 'id-token': 'write', 'pull-requests': 'write', deployments: 'write' });
		}
	});

	test('runs deploy and cleanup in the environments the two policies pin', () => {
		const { deploy, cleanup } = YAML.parse(workflow).jobs;

		expect(deploy.environment).toBe('preview');
		expect(cleanup.environment).toBe('preview-cleanup');
		// A deploy waiting for a reviewer must not hold up the cleanup of a closed pull request.
		expect(cleanup.concurrency).toBeUndefined();
	});

	// A step is the only way pull request code could reach the identity token, and these jobs need one.
	test('each job is the action and nothing else', () => {
		for (const job of Object.values(YAML.parse(workflow).jobs)) {
			expect(job.steps).toHaveLength(1);
			expect(job.steps[0].uses).toBe('HarperFast/deploy-action@45fa59b6157eabb72b7a74922309238671f2a37d');
			expect(job.steps[0].with).toMatchObject({
				target: '${{ vars.HARPER_PREVIEW_TARGET }}',
				preview: true,
			});
			// Previews deploy by reference by default; `by_ref: false` would upload the runner's directory.
			expect(job.steps[0].with.by_ref).toBeUndefined();
		}
	});

	test('fetches a private repository with the sealed credential', () => {
		const { deploy, cleanup } = YAML.parse(workflow).jobs;

		expect(deploy.steps[0].with.credential).toBe('${{ github.event.repository.private }}');
		expect(cleanup.steps[0].with.credential).toBeUndefined();
	});

	test('a project directory with shell syntax previews as a sanitized component name', () => {
		const target = path.join(tempDir, 'my app; printf X');
		scaffoldProject(target, 'my app; printf X', 'my-app', 'vanilla', undefined, 'npm', '10.9.0');
		const pkgJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf-8'));

		expect(readPreviewWorkflow(target)).toContain('app: my-app-printf-X\n');
		expect(pkgJson.scripts['deploy:setup-previews']).toBe(
			'node .github/previews/install-workflow.js && harper preview setup app=my-app-printf-X',
		);
	});

	for (const template of templates.filter((name) => name.startsWith('nextjs'))) {
		test(`${template} ships no preview workflow, since a commit has no .next to serve`, () => {
			const pkgJson = JSON.parse(fs.readFileSync(path.join(root, `template-${template}`, 'package.json'), 'utf-8'));

			expect(fs.existsSync(path.join(root, `template-${template}`, '_github', 'previews'))).toBe(false);
			expect(pkgJson.scripts['deploy:setup-previews']).toBeUndefined();
		});
	}
	// From December 2, 2026, GitHub fails a `pull_request_target` run in a public repository with no
	// Actions policy that allows the event, before any job's `if:` can skip it.
	for (const template of templates) {
		test(`${template} scaffolds no workflow that runs on pull_request_target`, () => {
			const project = scaffold(template, 'npm', '10.9.0', `${template}-fresh`);
			const workflows = path.join(project, '.github', 'workflows');

			expect(fs.readdirSync(workflows)).toEqual(['deploy.yaml']);
			expect(readFile(project, '.github', 'workflows', 'deploy.yaml')).not.toContain('pull_request_target');
		});
	}

	// `templates:apply-shared-templates` copies these into each template; nothing else keeps them in step.
	for (const template of previewTemplates) {
		for (const file of ['preview.yaml', 'install-workflow.js']) {
			test(`${template} ships the shared ${file}`, () => {
				const read = (dir) =>
					fs.readFileSync(path.join(root, dir, '_github', 'previews', file), 'utf-8').replaceAll('\r\n', '\n');

				expect(read(`template-${template}`)).toBe(read(path.join('templates-shared', 'all')));
			});
		}
	}

	describe('putting the workflow in place', () => {
		test('leaves a workflow that is already there alone', () => {
			const project = scaffold('vanilla', 'npm', '10.9.0', 'install-existing');
			const installed = path.join(project, '.github', 'workflows', 'preview.yaml');
			fs.writeFileSync(installed, 'name: Mine\n');
			const result = installWorkflow(project);

			expect(result.status, result.stderr).toBe(0);
			expect(fs.readFileSync(installed, 'utf-8')).toBe('name: Mine\n');
			expect(result.stdout).toContain(
				`Kept the existing ${
					path.join('.github', 'workflows', 'preview.yaml')
				}. Commit it to main only once setup succeeds`,
			);
		});

		test('creates .github/workflows when it is missing', () => {
			const project = scaffold('vanilla', 'npm', '10.9.0', 'install-no-workflows');
			fs.rmSync(path.join(project, '.github', 'workflows'), { recursive: true });
			const result = installWorkflow(project);

			expect(result.status, result.stderr).toBe(0);
			expect(readFile(project, '.github', 'workflows', 'preview.yaml')).toBe(readPreviewWorkflow(project));
		});

		test('installs into its own project wherever it runs from', () => {
			const project = scaffold('vanilla', 'npm', '10.9.0', 'install-elsewhere');
			const result = installWorkflow(project, tempDir);

			expect(result.status, result.stderr).toBe(0);
			expect(readFile(project, '.github', 'workflows', 'preview.yaml')).toBe(readPreviewWorkflow(project));
			expect(fs.existsSync(path.join(tempDir, '.github'))).toBe(false);
		});

		test('runs before harper, from the package.json script', () => {
			const project = scaffold('vanilla', 'npm', '10.9.0', 'setup-script');
			const bin = path.join(tempDir, 'fake-harper');
			const log = path.join(tempDir, 'fake-harper.json');
			fs.mkdirSync(bin);
			fs.writeFileSync(
				path.join(bin, 'harper.mjs'),
				[
					"import fs from 'node:fs';",
					'fs.writeFileSync(process.env.FAKE_HARPER_LOG, JSON.stringify({',
					'\targs: process.argv.slice(2),',
					"\tworkflow: fs.readFileSync('.github/workflows/preview.yaml', 'utf-8'),",
					'}));',
				].join('\n'),
			);
			fs.writeFileSync(path.join(bin, 'harper'), '#!/bin/sh\nexec node "$(dirname "$0")/harper.mjs" "$@"\n', {
				mode: 0o755,
			});
			fs.writeFileSync(path.join(bin, 'harper.cmd'), '@node "%~dp0harper.mjs" %*\r\n');
			// Windows matches environment variable names case-insensitively, and names it `Path`.
			const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH';
			const result = spawn.sync('npm', ['run', 'deploy:setup-previews'], {
				cwd: project,
				encoding: 'utf-8',
				timeout: 20_000,
				env: {
					...process.env,
					[pathKey]: `${bin}${path.delimiter}${process.env[pathKey]}`,
					FAKE_HARPER_LOG: log,
					npm_config_update_notifier: 'false',
				},
			});

			expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
			const seen = JSON.parse(fs.readFileSync(log, 'utf-8'));
			expect(seen.args).toEqual(['preview', 'setup', 'app=setup-script']);
			expect(seen.workflow.replaceAll('\r\n', '\n')).toBe(readPreviewWorkflow(project));
		});
	});
});
