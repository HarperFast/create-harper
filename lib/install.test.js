import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { install } from './install.js';
import { run } from './run.js';

vi.mock('@clack/prompts');
vi.mock('./run.js');

describe('install', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env._HARPER_TEST_CLI;
	});

	test('runs install command', () => {
		install('/root', 'npm', ['*'], []);
		expect(prompts.log.step).toHaveBeenCalledWith(
			'Installing dependencies with npm...',
		);
		expect(run).toHaveBeenCalledWith(['npm', 'install'], {
			stdio: 'inherit',
			cwd: '/root',
		});
		expect(prompts.log.step).toHaveBeenCalledWith('Installing Harper skills...');
		expect(run).toHaveBeenCalledWith(
			['npx', '-y', 'skills', 'add', 'harperfast/skills', '--skill', '*', '--yes'],
			{
				stdio: 'inherit',
				cwd: '/root',
			},
		);
	});

	test('runs install command with specific agents', () => {
		install('/root', 'npm', ['*'], ['cursor', 'windsurf']);
		expect(run).toHaveBeenCalledWith(
			['npx', '-y', 'skills', 'add', 'harperfast/skills', '--skill', '*', '--agent', 'cursor', 'windsurf', '--yes'],
			{
				stdio: 'inherit',
				cwd: '/root',
			},
		);
	});

	test('runs install command with --all if both are *', () => {
		install('/root', 'npm', ['*'], ['*']);
		expect(run).toHaveBeenCalledWith(
			['npx', '-y', 'skills', 'add', 'harperfast/skills', '--all'],
			{
				stdio: 'inherit',
				cwd: '/root',
			},
		);
	});

	test('skips skills if selectedSkills is empty', () => {
		install('/root', 'npm', [], []);
		expect(prompts.log.step).not.toHaveBeenCalledWith('Installing Harper skills...');
		expect(run).not.toHaveBeenCalledWith(
			expect.arrayContaining(['skills']),
			expect.anything(),
		);
	});

	test('skips if _HARPER_TEST_CLI is set', () => {
		process.env._HARPER_TEST_CLI = 'true';
		install('/root', 'npm');
		expect(prompts.log.step).toHaveBeenCalledWith('Installing dependencies with npm... (skipped in test)');
		expect(run).not.toHaveBeenCalled();
	});
});
