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
		install('/root', 'npm');
		expect(prompts.log.step).toHaveBeenCalledWith('Installing dependencies with npm...');
		expect(run).toHaveBeenCalledWith(['npm', 'install'], {
			stdio: 'inherit',
			cwd: '/root',
		});
	});

	test('skips if _HARPER_TEST_CLI is set', () => {
		process.env._HARPER_TEST_CLI = 'true';
		install('/root', 'npm');
		expect(prompts.log.step).toHaveBeenCalledWith('Installing dependencies with npm... (skipped in test)');
		expect(run).not.toHaveBeenCalled();
	});
});
