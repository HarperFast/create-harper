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
			username: 'testuser',
			target: 'testtarget',
			password: 'testpassword',
		};

		scaffoldProject(root, projectName, packageName, template, envVars, ['ex1']);

		expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
		expect(prompts.log.step).toHaveBeenCalledWith(expect.stringContaining('Scaffolding project'));
		expect(crawlTemplateDir).toHaveBeenCalledWith(
			root,
			expect.stringContaining(`template-${template}`),
			{
				'your-project-name-here': projectName,
				'your-package-name-here': packageName,
				'your-cluster-username-here': envVars.username,
				'your-cluster-password-here': envVars.password,
				'your-fabric.harper.fast-cluster-url-here': envVars.target,
			},
			['ex1'],
		);
	});
});
