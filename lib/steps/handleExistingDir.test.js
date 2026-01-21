import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { emptyDir } from '../fs/emptyDir.js';
import { isEmpty } from '../fs/isEmpty.js';
import { handleExistingDir } from './handleExistingDir.js';

vi.mock('@clack/prompts');
vi.mock('node:fs');
vi.mock('../fs/emptyDir.js');
vi.mock('../fs/isEmpty.js');

describe('handleExistingDir', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(prompts.isCancel).mockReturnValue(false);
	});

	test('does nothing if directory does not exist', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		const result = await handleExistingDir('dir', undefined, false);
		expect(result.cancelled).toBe(false);
		expect(emptyDir).not.toHaveBeenCalled();
	});

	test('does nothing if directory is empty', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(true);
		const result = await handleExistingDir('dir', undefined, false);
		expect(result.cancelled).toBe(false);
		expect(emptyDir).not.toHaveBeenCalled();
	});

	test('empties dir if argOverwrite is true', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(false);
		const result = await handleExistingDir('dir', true, false);
		expect(result.cancelled).toBe(false);
		expect(emptyDir).toHaveBeenCalledWith('dir');
	});

	test('prompts if interactive and not empty', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(false);
		vi.mocked(prompts.select).mockResolvedValue('yes');
		const result = await handleExistingDir('dir', undefined, true);
		expect(prompts.select).toHaveBeenCalled();
		expect(emptyDir).toHaveBeenCalledWith('dir');
		expect(result.cancelled).toBe(false);
	});

	test('cancels if prompt says no', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(false);
		vi.mocked(prompts.select).mockResolvedValue('no');
		const result = await handleExistingDir('dir', undefined, true);
		expect(result.cancelled).toBe(true);
		expect(emptyDir).not.toHaveBeenCalled();
	});

	test('cancels if not interactive and not empty and no overwrite', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(false);
		const result = await handleExistingDir('dir', undefined, false);
		expect(result.cancelled).toBe(true);
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(false);
		vi.mocked(prompts.select).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await handleExistingDir('dir', undefined, true);
		expect(result.cancelled).toBe(true);
	});

	test('shows "Current directory" in prompt if targetDir is "."', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(isEmpty).mockReturnValue(false);
		vi.mocked(prompts.select).mockResolvedValue('yes');
		await handleExistingDir('.', undefined, true);
		expect(prompts.select).toHaveBeenCalledWith(expect.objectContaining({
			message: expect.stringContaining('Current directory'),
		}));
	});
});
