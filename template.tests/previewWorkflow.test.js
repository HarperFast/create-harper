import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { scaffoldProject } from '../lib/steps/scaffoldProject.js';
import { checkWorkflowFile } from './harper/workflowChecks.ts';

vi.mock('@clack/prompts');

const root = path.resolve(import.meta.dirname, '..');
const deployWorkflowPath = path.join('_github', 'workflows', 'deploy.yaml');

// A Next.js commit has no `.next`, and building on the cluster fails (HarperFast/nextjs#57, #58).
const templates = fs.readdirSync(root)
	.filter((name) => name.startsWith('template-') && fs.existsSync(path.join(root, name, deployWorkflowPath)))
	.map((name) => name.slice('template-'.length));
const previewTemplates = templates.filter((name) => !name.startsWith('nextjs'));

const packageManagers = [['npm', '10.9.0'], ['pnpm', '11.17.0'], ['yarn', '4.9.1'], ['bun', '1.2.19'], [
	'deno',
	'2.1.0',
]];

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

function readScripts(project) {
	return JSON.parse(readFile(project, 'package.json')).scripts;
}

// Each test writes a whole project to disk, which a Windows runner has stalled for over 5s.
describe('pull request previews', { timeout: 30_000 }, () => {
	/** @type {string} */
	let tempDir;

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
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test('finds the templates that preview by reference', () => {
		expect(previewTemplates.length).toBe(10);
	});

	for (const template of previewTemplates) {
		for (const [agent, version] of packageManagers) {
			test(`${template} with ${agent} passes the checks harper runs on the deploy workflow`, () => {
				const project = scaffold(template, agent, version);

				expect(checkWorkflowFile(readFile(project, '.github', 'workflows', 'deploy.yaml'), 'main', 'production'))
					.toEqual({ problems: [], unverified: [] });
			});
		}

		// `harper preview setup` writes its own workflow only when the file is missing, and checks one that isn't.
		test(`${template} has harper write the preview workflow when previews are turned on`, () => {
			const project = scaffold(template, 'npm', '10.9.0');

			expect(readScripts(project)['deploy:setup-previews']).toBe(
				`harper preview setup app=${template}-npm write_workflow=true`,
			);
		});
	}

	// From December 2, 2026, GitHub fails a `pull_request_target` run in a public repository with no
	// Actions policy that allows the event, before any job's `if:` can skip it.
	for (const template of templates) {
		test(`${template} scaffolds no workflow that runs on pull_request_target`, () => {
			const project = scaffold(template, 'npm', '10.9.0', `${template}-fresh`);

			expect(fs.readdirSync(path.join(project, '.github'))).toEqual(['workflows']);
			expect(fs.readdirSync(path.join(project, '.github', 'workflows'))).toEqual(['deploy.yaml']);
			expect(readFile(project, '.github', 'workflows', 'deploy.yaml')).not.toContain('pull_request_target');
		});
	}

	test('a project directory with shell syntax previews as a sanitized component name', () => {
		const target = path.join(tempDir, 'my app; printf X');
		scaffoldProject(target, 'my app; printf X', 'my-app', 'vanilla', undefined, 'npm', '10.9.0');

		expect(readScripts(target)['deploy:setup-previews']).toBe(
			'harper preview setup app=my-app-printf-X write_workflow=true',
		);
	});

	for (const template of templates.filter((name) => name.startsWith('nextjs'))) {
		test(`${template} has no previews, since a commit has no .next to serve`, () => {
			const pkgJson = JSON.parse(fs.readFileSync(path.join(root, `template-${template}`, 'package.json'), 'utf-8'));

			expect(pkgJson.scripts['deploy:setup-previews']).toBeUndefined();
		});
	}
});
