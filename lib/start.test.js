import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { run } from './run.js';
import { start } from './start.js';

vi.mock('@clack/prompts');
vi.mock('./run.js');

describe('start', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env._HARPER_TEST_CLI;
	});

	test('runs start command', () => {
		start('/root', 'npm');
		expect(prompts.log.step).toHaveBeenCalledWith('Starting dev server...');
		expect(run).toHaveBeenCalledWith(['npm', 'run', 'dev'], {
			stdio: 'inherit',
			cwd: '/root',
		});
	});

	test('skips if _HARPER_TEST_CLI is set', () => {
		process.env._HARPER_TEST_CLI = 'true';
		start('/root', 'npm');
		expect(prompts.log.step).toHaveBeenCalledWith('Starting dev server... (skipped in test)');
		expect(run).not.toHaveBeenCalled();
	});
});
