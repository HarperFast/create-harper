import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { crawlTemplateDir } from '../fs/crawlTemplateDir.js';
import { scaffoldProject } from './scaffoldProject.js';

vi.mock('@clack/prompts');
vi.mock('node:fs');
vi.mock('../fs/crawlTemplateDir.js');

describe('scaffoldProject', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('calls mkdirSync and crawlTemplateDir with correct arguments', () => {
		const root = 'test-dir';
		const projectName = 'test-project';
		const packageName = 'test-package';
		const template = 'vanilla';
		const envVars = {
			target: 'testtarget',
		};

		scaffoldProject(root, projectName, packageName, template, envVars, 'pnpm', '11.17.0');

		expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
		expect(prompts.log.step).toHaveBeenCalledWith(expect.stringContaining('Scaffolding project'));
		expect(crawlTemplateDir).toHaveBeenCalledWith(
			root,
			expect.stringContaining(`template-${template}`),
			expect.objectContaining({
				'your-project-name-here': projectName,
				'your-package-name-here': packageName,
				'your-fabric.harper.fast-cluster-url-here': envVars.target,
				'your-package-manager-here': 'pnpm',
				// The CI workflows follow the detected package manager rather than hard-coding npm.
				'your-package-manager-install-here': 'pnpm install --frozen-lockfile',
				'your-package-manager-run-here': 'pnpm run',
			}),
		);
	});
	test('uses default values when arguments are missing', () => {
		const root = 'test-dir';
		const template = 'vanilla';

		scaffoldProject(root, undefined, undefined, template);

		expect(crawlTemplateDir).toHaveBeenCalledWith(
			root,
			expect.stringContaining(`template-${template}`),
			expect.objectContaining({
				'your-project-name-here': 'your-project-name-here',
				'your-package-name-here': 'your-package-name-here',
				'your-fabric.harper.fast-cluster-url-here': 'your-fabric.harper.fast-cluster-url-here',
				'your-package-manager-here': 'npm',
				'your-package-manager-install-here': 'npm ci',
				'your-package-manager-run-here': 'npm run',
			}),
		);
	});
});
