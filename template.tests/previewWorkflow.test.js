import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import * as YAML from 'yaml';
import { scaffoldProject } from '../lib/steps/scaffoldProject.js';
import { checkPreviewWorkflowFile, checkWorkflowFile } from './harper/workflowChecks.ts';

// Scaffolding narrates every file it writes; these tests care about the files.
vi.mock('@clack/prompts');

const root = path.resolve(import.meta.dirname, '..');
const deployWorkflowPath = path.join('_github', 'workflows', 'deploy.yaml');
const previewWorkflowPath = path.join('_github', 'workflows', 'preview.yaml');

// The templates Harper can preview by reference: the cluster fetches the commit, then installs and
// builds it. A Next.js commit has no `.next`, and building on the cluster fails (HarperFast/nextjs#57, #58).
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

/**
 * A workflow as a scaffolded project holds it, with LF line endings: a Windows checkout has CRLF.
 *
 * @param {string} project - The scaffolded project's directory.
 * @param {string} file - The workflow's file name.
 * @returns {string} - The workflow's contents.
 */
function readWorkflow(project, file) {
	return fs.readFileSync(path.join(project, '.github', 'workflows', file), 'utf-8').replaceAll('\r\n', '\n');
}

describe('scaffolded preview workflows', () => {
	/** @type {string} */
	let tempDir;
	/** @type {string} */
	let workflow;

	/**
	 * @param {string} template - The template name to scaffold.
	 * @param {string} agent - The package manager to scaffold for.
	 * @param {string} version - That package manager's version.
	 * @returns {string} - The scaffolded project's directory.
	 */
	function scaffold(template, agent, version) {
		const target = path.join(tempDir, `${template}-${agent}`);
		scaffoldProject(target, 'shop', 'shop', template, undefined, agent, version);
		return target;
	}

	beforeAll(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-harper-preview-workflow-'));
		workflow = readWorkflow(scaffold('vanilla', 'npm', '10.9.0'), 'preview.yaml');
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
				const preview = readWorkflow(project, 'preview.yaml');

				expect(check(preview)).toEqual(clean);
				expect(checkWorkflowFile(readWorkflow(project, 'deploy.yaml'), 'main', 'production')).toEqual({
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

			expect(pkgJson.scripts['deploy:setup-previews']).toBe(`harper preview setup app=${template}-npm`);
		});
	}

	// If these don't fail, passing the checks above says nothing.
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
			expect(job.steps[0].uses).toBe('HarperFast/deploy-action@v1');
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

		expect(readWorkflow(target, 'preview.yaml')).toContain('app: my-app-printf-X\n');
		expect(pkgJson.scripts['deploy:setup-previews']).toBe('harper preview setup app=my-app-printf-X');
	});

	for (const template of templates.filter((name) => name.startsWith('nextjs'))) {
		test(`${template} ships no preview workflow, since a commit has no .next to serve`, () => {
			const pkgJson = JSON.parse(fs.readFileSync(path.join(root, `template-${template}`, 'package.json'), 'utf-8'));

			expect(fs.existsSync(path.join(root, `template-${template}`, previewWorkflowPath))).toBe(false);
			expect(pkgJson.scripts['deploy:setup-previews']).toBeUndefined();
		});
	}
});
