import spawn from 'cross-spawn';
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLatestVersion } from '../pkg/getLatestVersion.js';
import { checkForUpdate } from './checkForUpdate.js';

vi.mock('node:fs');
vi.mock('cross-spawn');
vi.mock('../pkg/getLatestVersion.js');

describe('checkForUpdate', () => {
	const originalArgv = process.argv;
	const originalExit = process.exit;
	const mockExit = vi.fn();

	beforeEach(() => {
		process.exit = mockExit;
		process.argv = ['node', 'index.js', 'my-project', '--template', 'react'];
		vi.clearAllMocks();
		delete process.env.CREATE_HARPER_SKIP_UPDATE;
	});

	afterEach(() => {
		process.argv = originalArgv;
		process.exit = originalExit;
	});

	it('should do nothing if versions match', async () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper', version: '0.0.5' }));
		vi.mocked(getLatestVersion).mockResolvedValue('0.0.5');

		await checkForUpdate();

		expect(spawn.sync).not.toHaveBeenCalled();
		expect(mockExit).not.toHaveBeenCalled();
	});

	it('should do nothing if current version is newer (dev)', async () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper', version: '0.0.6-dev' }));
		vi.mocked(getLatestVersion).mockResolvedValue('0.0.5');

		await checkForUpdate();

		expect(spawn.sync).not.toHaveBeenCalled();
		expect(mockExit).not.toHaveBeenCalled();
	});

	it('should update if a newer version is available', async () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper', version: '0.0.5' }));
		vi.mocked(getLatestVersion).mockResolvedValue('0.0.6');
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 });

		await checkForUpdate();

		expect(spawn.sync).toHaveBeenCalledWith('npx', ['create-harper@latest', 'my-project', '--template', 'react'], {
			stdio: 'inherit',
		});
		expect(mockExit).toHaveBeenCalledWith(0);
	});

	it('should handle major version updates', async () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper', version: '0.0.5' }));
		vi.mocked(getLatestVersion).mockResolvedValue('1.0.0');
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 });

		await checkForUpdate();

		expect(spawn.sync).toHaveBeenCalled();
		expect(mockExit).toHaveBeenCalledWith(0);
	});

	it('should handle minor version updates', async () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper', version: '0.0.5' }));
		vi.mocked(getLatestVersion).mockResolvedValue('0.1.0');
		vi.mocked(spawn.sync).mockReturnValue({ status: 0 });

		await checkForUpdate();

		expect(spawn.sync).toHaveBeenCalled();
		expect(mockExit).toHaveBeenCalledWith(0);
	});

	it('should skip update if CREATE_HARPER_SKIP_UPDATE is set', async () => {
		process.env.CREATE_HARPER_SKIP_UPDATE = 'true';
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper', version: '0.0.5' }));
		vi.mocked(getLatestVersion).mockResolvedValue('0.0.6');

		await checkForUpdate();

		expect(spawn.sync).not.toHaveBeenCalled();
	});

	it('should handle errors gracefully', async () => {
		vi.mocked(getLatestVersion).mockRejectedValue(new Error('Network error'));

		await expect(checkForUpdate()).resolves.not.toThrow();
		expect(spawn.sync).not.toHaveBeenCalled();
	});
});
