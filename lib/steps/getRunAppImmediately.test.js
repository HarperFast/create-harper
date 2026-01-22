import * as prompts from '@clack/prompts';
import spawn from 'cross-spawn';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getRunAppImmediately } from './getRunAppImmediately.js';

vi.mock('@clack/prompts', () => ({
	confirm: vi.fn(),
	isCancel: vi.fn((val) => typeof val === 'symbol' && val.toString().includes('cancel')),
	log: {
		step: vi.fn(),
		success: vi.fn(),
		error: vi.fn(),
	},
}));
vi.mock('cross-spawn');

describe('getRunAppImmediately', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	test('should check if harper is installed when interactive', async () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 }); // Harper is installed
		vi.mocked(prompts.confirm).mockResolvedValue(true);

		await getRunAppImmediately(undefined, true, 'npm');

		expect(spawn.sync).toHaveBeenCalledWith('harper', ['version'], { stdio: 'ignore' });
	});

	test('should prompt to install harper if not installed and interactive', async () => {
		vi.mocked(spawn.sync)
			.mockReturnValueOnce({ status: 1 }) // Harper not installed
			.mockReturnValueOnce({ status: 0 }); // Install success

		vi.mocked(prompts.confirm).mockResolvedValue(true);

		await getRunAppImmediately(undefined, true, 'npm');

		expect(prompts.confirm).toHaveBeenCalledWith(expect.objectContaining({
			message: 'Harper CLI not found. Would you like to install it?',
		}));
		expect(spawn.sync).toHaveBeenCalledWith('npm', ['install', '-g', 'harperdb'], expect.any(Object));
		expect(spawn.sync).toHaveBeenCalledWith('harper', ['status'], expect.any(Object));
	});

	test('should not prompt to install harper if already installed', async () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 }); // Harper is installed

		await getRunAppImmediately(undefined, true, 'npm');

		expect(prompts.confirm).not.toHaveBeenCalledWith(expect.objectContaining({
			message: 'Harper CLI not found. Would you like to install it?',
		}));
	});

	test('should not check for harper if not interactive', async () => {
		await getRunAppImmediately(undefined, false, 'npm');

		expect(spawn.sync).not.toHaveBeenCalled();
	});

	test('should handle cancellation of harper installation prompt', async () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 1 }); // Harper not installed
		vi.mocked(prompts.confirm).mockResolvedValue(Symbol('clack:cancel'));

		const result = await getRunAppImmediately(undefined, true, 'npm');

		expect(result).toEqual({ immediate: false, cancelled: true });
	});

	test('should continue if user chooses not to install harper', async () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 1 }); // Harper not installed
		vi.mocked(prompts.confirm)
			.mockResolvedValueOnce(false) // Don't install harper
			.mockResolvedValueOnce(true); // Immediate install project

		const result = await getRunAppImmediately(undefined, true, 'npm');

		expect(result).toEqual({ immediate: true, cancelled: false });
		expect(spawn.sync).not.toHaveBeenCalledWith('npm', ['install', '-g', 'harperdb'], expect.any(Object));
	});

	test('should use argImmediate if provided when not interactive', async () => {
		const result = await getRunAppImmediately(true, false, 'npm');
		expect(result).toEqual({ immediate: true, cancelled: false });
	});

	test('should use false if not interactive and no argImmediate', async () => {
		const result = await getRunAppImmediately(undefined, false, 'npm');
		expect(result).toEqual({ immediate: false, cancelled: false });
	});

	test('should return cancelled: true if project immediate prompt is cancelled', async () => {
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 }); // Harper installed
		vi.mocked(prompts.confirm).mockResolvedValue(Symbol('clack:cancel'));

		const result = await getRunAppImmediately(undefined, true, 'npm');
		expect(result).toEqual({ immediate: false, cancelled: true });
	});
});
