import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getEnvVars } from './getEnvVars.js';

vi.mock('node:fs');
vi.mock('@clack/prompts', () => ({
	text: vi.fn(),
	password: vi.fn(),
	isCancel: vi.fn(),
	log: {
		warn: vi.fn(),
	},
}));

describe('getEnvVars', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(prompts.isCancel).mockImplementation((val) =>
			val === Symbol.for('clack:cancel') || typeof val === 'symbol'
		);
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
		const argv = {
			'cli-target-username': 'testuser',
			'cli-target': 'testtarget',
		};
		const result = await getEnvVars(argv, false, 'vanilla');
		expect(result).toEqual({
			envVars: {
				username: 'testuser',
				target: 'testtarget',
				password: 'YOUR_CLUSTER_PASSWORD',
			},
			cancelled: false,
		});
	});

	test('uses default values if not interactive and no argv', async () => {
		const result = await getEnvVars({}, false, 'vanilla');
		expect(result).toEqual({
			envVars: {
				username: 'YOUR_CLUSTER_USERNAME',
				target: 'YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE',
				password: 'YOUR_CLUSTER_PASSWORD',
			},
			cancelled: false,
		});
		expect(prompts.log.warn).toHaveBeenCalled();
	});

	test('prompts if interactive and no argv', async () => {
		vi.mocked(prompts.text)
			.mockResolvedValueOnce('promptuser')
			.mockResolvedValueOnce('prompttarget');
		vi.mocked(prompts.password).mockResolvedValue('promptpassword');

		const result = await getEnvVars({}, true, 'vanilla');

		expect(prompts.text).toHaveBeenCalledTimes(2);
		expect(prompts.password).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			envVars: {
				username: 'promptuser',
				target: 'prompttarget',
				password: 'promptpassword',
			},
			cancelled: false,
		});
	});

	test('returns cancelled: true if username prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValue(Symbol('cancel'));

		const result = await getEnvVars({}, true, 'vanilla');
		expect(result.cancelled).toBe(true);
	});

	test('returns cancelled: true if target prompt is cancelled', async () => {
		vi.mocked(prompts.text)
			.mockResolvedValueOnce('promptuser')
			.mockResolvedValueOnce(Symbol('cancel'));
		vi.mocked(prompts.password).mockResolvedValue('promptpassword');

		const result = await getEnvVars({}, true, 'vanilla');
		expect(result.cancelled).toBe(true);
		expect(prompts.text).toHaveBeenCalledTimes(2);
	});

	test('returns cancelled: true if password prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce('promptuser');
		vi.mocked(prompts.password).mockResolvedValue(Symbol('cancel'));

		const result = await getEnvVars({}, true, 'vanilla');
		expect(result.cancelled).toBe(true);
		expect(prompts.text).toHaveBeenCalledTimes(1);
	});

	test('skips password and target prompts if username is not provided', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce(''); // Empty username

		const result = await getEnvVars({}, true, 'vanilla');

		expect(prompts.text).toHaveBeenCalledTimes(1);
		expect(prompts.password).not.toHaveBeenCalled();
		expect(result).toEqual({
			envVars: {
				username: 'YOUR_CLUSTER_USERNAME',
				target: 'YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE',
				password: 'YOUR_CLUSTER_PASSWORD',
			},
			cancelled: false,
		});
	});
});
