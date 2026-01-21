import spawn from 'cross-spawn';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { run } from './run.js';

vi.mock('cross-spawn');

describe('run', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(process, 'exit').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('executes command successfully', () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 });
		run(['npm', 'install'], { cwd: '.' });
		expect(spawn.sync).toHaveBeenCalledWith('npm', ['install'], { cwd: '.' });
		expect(process.exit).not.toHaveBeenCalled();
	});

	test('exits if command returns non-zero status', () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 1 });
		run(['npm', 'install'], { cwd: '.' });
		expect(process.exit).toHaveBeenCalledWith(1);
	});

	test('exits and logs error if spawn fails', () => {
		const error = new Error('spawn failed');
		vi.mocked(spawn.sync).mockReturnValue({ error });
		run(['npm', 'install'], { cwd: '.' });
		expect(console.error).toHaveBeenCalledWith('\nnpm install error!');
		expect(console.error).toHaveBeenCalledWith(error);
		expect(process.exit).toHaveBeenCalledWith(1);
	});
});
