import * as prompts from '@clack/prompts';
import spawn from 'cross-spawn';
import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getEnvVars } from './getEnvVars.js';

vi.mock('node:fs');
vi.mock('cross-spawn');
vi.mock('@clack/prompts', () => ({
	text: vi.fn(),
	password: vi.fn(),
	confirm: vi.fn(),
	isCancel: vi.fn(),
	log: {
		warn: vi.fn(),
		success: vi.fn(),
		error: vi.fn(),
	},
	note: vi.fn(),
}));

describe('getEnvVars', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(prompts.isCancel).mockImplementation((val) =>
			val === Symbol.for('clack:cancel') || typeof val === 'symbol'
		);
		vi.stubGlobal('fetch', vi.fn());
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 });
	});

	test('returns empty envVars if template has no _env file', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		const result = await getEnvVars({}, false, 'studio');
		expect(result).toEqual({
			envVars: {},
			cancelled: false,
		});
		expect(prompts.log.warn).not.toHaveBeenCalled();
	});

	test('uses argv values if provided', async () => {
		const argTarget = 'testtarget';
		const result = await getEnvVars(false, 'vanilla', argTarget);
		expect(result).toEqual({
			envVars: {
				target: 'https://testtarget:9925/',
			},
			cancelled: false,
		});
	});

	test('uses default values if not interactive and no argv', async () => {
		const result = await getEnvVars(false, 'vanilla');
		expect(result).toEqual({
			envVars: {
				target: 'YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE',
			},
			cancelled: false,
		});
	});

	test('prompts if interactive and no argv', async () => {
		vi.mocked(prompts.text)
			.mockResolvedValueOnce('prompttarget');
		vi.mocked(prompts.confirm).mockResolvedValue(true);

		const result = await getEnvVars(true, 'vanilla');

		expect(prompts.text).toHaveBeenCalledTimes(1);
		expect(spawn.sync).toHaveBeenCalledWith('harper', ['login', 'https://prompttarget:9925/'], expect.any(Object));
		expect(result).toEqual({
			envVars: {
				target: 'https://prompttarget:9925/',
			},
			cancelled: false,
		});
	});

	test('returns cancelled: true if target prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValue(Symbol('cancel'));

		const result = await getEnvVars(true, 'vanilla');
		expect(result.cancelled).toBe(true);
	});

	test('returns cancelled: true if login confirm is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce('prompttarget');
		vi.mocked(prompts.confirm).mockResolvedValue(Symbol('cancel'));

		const result = await getEnvVars(true, 'vanilla');
		expect(result.cancelled).toBe(true);
	});

	test('does not login if confirm is false', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce('prompttarget');
		vi.mocked(prompts.confirm).mockResolvedValue(false);

		const result = await getEnvVars(true, 'vanilla');

		expect(spawn.sync).not.toHaveBeenCalled();
		expect(result.cancelled).toBe(false);
	});

	test('logs error if login fails', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce('prompttarget');
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		vi.mocked(spawn.sync).mockReturnValue({ status: 1 });

		await getEnvVars(true, 'vanilla');

		expect(prompts.log.error).toHaveBeenCalledWith(expect.stringContaining('Failed to login'));
	});

	test('normalizes target URL', async () => {
		const argTarget = 'example.com';
		const result = await getEnvVars(false, 'vanilla', argTarget);
		expect(result.envVars.target).toBe('https://example.com:9925/');
	});

	test('normalizes target URL with http', async () => {
		const argTarget = 'http://example.com';
		const result = await getEnvVars(false, 'vanilla', argTarget);
		expect(result.envVars.target).toBe('http://example.com:9925/');
	});

	test('normalizes target URL with trailing slash', async () => {
		const argTarget = 'https://example.com/';
		const result = await getEnvVars(false, 'vanilla', argTarget);
		expect(result.envVars.target).toBe('https://example.com:9925/');
	});
});
