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
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe('getEnvVars', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(prompts.isCancel).mockImplementation((val) =>
			val === Symbol.for('clack:cancel') || typeof val === 'symbol'
		);
		vi.stubGlobal('fetch', vi.fn());
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
		const argUsername = 'testuser';
		const argTarget = 'testtarget';
		const result = await getEnvVars(false, 'vanilla', argUsername, argTarget);
		expect(result).toEqual({
			envVars: {
				username: 'testuser',
				target: 'https://testtarget/',
				password: 'YOUR_CLUSTER_PASSWORD',
			},
			cancelled: false,
		});
	});

	test('uses default values if not interactive and no argv', async () => {
		const result = await getEnvVars(false, 'vanilla');
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

		const result = await getEnvVars(true, 'vanilla');

		expect(prompts.text).toHaveBeenCalledTimes(2);
		expect(prompts.password).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			envVars: {
				username: 'promptuser',
				target: 'https://prompttarget/',
				password: 'promptpassword',
			},
			cancelled: false,
		});
	});

	test('returns cancelled: true if username prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValue(Symbol('cancel'));

		const result = await getEnvVars(true, 'vanilla');
		expect(result.cancelled).toBe(true);
	});

	test('returns cancelled: true if target prompt is cancelled', async () => {
		vi.mocked(prompts.text)
			.mockResolvedValueOnce('promptuser')
			.mockResolvedValueOnce(Symbol('cancel'));
		vi.mocked(prompts.password).mockResolvedValue('promptpassword');

		const result = await getEnvVars(true, 'vanilla');
		expect(result.cancelled).toBe(true);
		expect(prompts.text).toHaveBeenCalledTimes(2);
	});

	test('returns cancelled: true if password prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce('promptuser');
		vi.mocked(prompts.password).mockResolvedValue(Symbol('cancel'));

		const result = await getEnvVars(true, 'vanilla');
		expect(result.cancelled).toBe(true);
		expect(prompts.text).toHaveBeenCalledTimes(1);
	});

	test('skips password and target prompts if username is not provided', async () => {
		vi.mocked(prompts.text).mockResolvedValueOnce(''); // Empty username

		const result = await getEnvVars(true, 'vanilla');

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

	test('normalizes target URL', async () => {
		const argUsername = 'user';
		const argTarget = 'example.com';
		// Set _HARPER_TEST_CLI to skip fetch checks but still test normalization
		const originalEnv = process.env._HARPER_TEST_CLI;
		process.env._HARPER_TEST_CLI = 'true';

		const result = await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(result.envVars.target).toBe('https://example.com/');
		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('normalizes target URL with http', async () => {
		const argUsername = 'user';
		const argTarget = 'http://example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		process.env._HARPER_TEST_CLI = 'true';

		const result = await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(result.envVars.target).toBe('http://example.com/');
		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('normalizes target URL with trailing slash', async () => {
		const argUsername = 'user';
		const argTarget = 'https://example.com/';
		const originalEnv = process.env._HARPER_TEST_CLI;
		process.env._HARPER_TEST_CLI = 'true';

		const result = await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(result.envVars.target).toBe('https://example.com/');
		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('skips network checks if _HARPER_TEST_CLI is set', async () => {
		const argUsername = 'user';
		const argTarget = 'example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		process.env._HARPER_TEST_CLI = 'true';

		await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(global.fetch).not.toHaveBeenCalled();
		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('performs health and auth checks if not in test mode', async () => {
		const argUsername = 'user';
		const argTarget = 'example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		delete process.env._HARPER_TEST_CLI;

		vi.mocked(global.fetch)
			.mockResolvedValueOnce({ ok: true }) // Health check
			.mockResolvedValueOnce({ ok: true }); // Auth check

		// We need a password for auth check
		vi.mocked(prompts.password).mockResolvedValue('pass');
		// Force interactive to prompt for password
		await getEnvVars(true, 'vanilla', argUsername, argTarget);

		expect(global.fetch).toHaveBeenCalledWith('https://example.com:9925/health');
		expect(global.fetch).toHaveBeenCalledWith(
			'https://example.com:9925/',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ operation: 'user_info' }),
			}),
		);
		expect(prompts.log.success).toHaveBeenCalledWith(expect.stringContaining('Successfully'));

		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('logs error if health check fails', async () => {
		const argUsername = 'user';
		const argTarget = 'example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		delete process.env._HARPER_TEST_CLI;

		vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false }); // Health check fails

		await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(prompts.log.error).toHaveBeenCalledWith(expect.stringContaining('health'));

		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('logs error if auth check fails', async () => {
		const argUsername = 'user';
		const argTarget = 'example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		delete process.env._HARPER_TEST_CLI;

		vi.mocked(global.fetch)
			.mockResolvedValueOnce({ ok: true }) // Health check ok
			.mockResolvedValueOnce({ ok: false }); // Auth check fails

		// Mock password for auth check
		vi.mocked(prompts.password).mockResolvedValue('pass');

		await getEnvVars(true, 'vanilla', argUsername, argTarget);

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(prompts.log.error).toHaveBeenCalledWith(expect.stringContaining('authenticate'));

		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('handles fetch error gracefully', async () => {
		const argUsername = 'user';
		const argTarget = 'example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		delete process.env._HARPER_TEST_CLI;

		vi.mocked(global.fetch).mockRejectedValue(new Error('Fetch failed'));

		await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(prompts.log.error).toHaveBeenCalledWith(expect.stringContaining('An error occurred'));

		process.env._HARPER_TEST_CLI = originalEnv;
	});

	test('skips auth check if username is default', async () => {
		const argUsername = 'YOUR_CLUSTER_USERNAME';
		const argTarget = 'example.com';
		const originalEnv = process.env._HARPER_TEST_CLI;
		delete process.env._HARPER_TEST_CLI;

		vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true }); // Health check ok

		await getEnvVars(false, 'vanilla', argUsername, argTarget);

		expect(global.fetch).toHaveBeenCalledTimes(1); // Only health check

		process.env._HARPER_TEST_CLI = originalEnv;
	});
});
