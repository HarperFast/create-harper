import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { install } from '../install.js';
import { start } from '../start.js';
import { installAndOptionallyStart } from './installAndOptionallyStart.js';

vi.mock('@clack/prompts');
vi.mock('../install.js');
vi.mock('../start.js');
vi.mock('../pkg/getInstallCommand.js', () => ({
	getInstallCommand: vi.fn(() => ['npm', 'install']),
}));
vi.mock('../pkg/getRunCommand.js', () => ({
	getRunCommand: vi.fn(() => ['npm', 'run', 'dev']),
}));

describe('installAndOptionallyStart', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('calls install and start if immediate is true', () => {
		installAndOptionallyStart('/root', 'npm', true);
		expect(install).toHaveBeenCalledWith('/root', 'npm', undefined, undefined);
		expect(start).toHaveBeenCalledWith('/root', 'npm');
	});

	test('calls prompts.outro if immediate is false', () => {
		installAndOptionallyStart('/root', 'npm', false);
		expect(prompts.outro).toHaveBeenCalled();
		expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining('Done. Now run:'));
	});

	test('shows cd command if root is not current directory', () => {
		vi.spyOn(process, 'cwd').mockReturnValue('/cwd');
		installAndOptionallyStart('/cwd/my-project', 'npm', false);
		expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining('cd my-project'));
	});

	test('quotes cd command if path has spaces', () => {
		vi.spyOn(process, 'cwd').mockReturnValue('/cwd');
		installAndOptionallyStart('/cwd/my project', 'npm', false);
		expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining('cd "my project"'));
	});

	test('does not show cd command if root is current directory', () => {
		vi.spyOn(process, 'cwd').mockReturnValue('/cwd');
		installAndOptionallyStart('/cwd', 'npm', false);
		expect(prompts.outro).not.toHaveBeenLastCalledWith(expect.stringContaining('cd '));
	});

	// The scaffolder can't set up deploys itself (the GitHub repository rarely exists yet), so it
	// lists the steps whenever the project ships the deploy workflow — even when it starts dev.
	test('lists the deploy setup steps when the project ships a deploy workflow', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'create-harper-outro-'));
		try {
			fs.mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
			fs.writeFileSync(path.join(root, '.github', 'workflows', 'deploy.yaml'), '');
			installAndOptionallyStart(root, 'npm', true);
			expect(prompts.note).toHaveBeenCalledWith(
				expect.stringContaining('Push this project to a GitHub repository.'),
				'Deploy from GitHub',
			);
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	test('says nothing about deploying when the project has no deploy workflow', () => {
		installAndOptionallyStart('/root', 'npm', false);
		expect(prompts.note).not.toHaveBeenCalled();
	});
});
