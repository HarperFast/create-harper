import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { emptyDir } from './emptyDir.js';

vi.mock('node:fs');

describe(emptyDir, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('does nothing if directory does not exist', () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		emptyDir('non-existent');
		expect(fs.readdirSync).not.toHaveBeenCalled();
	});

	test('removes all files except .git', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readdirSync).mockReturnValue(['file1.txt', 'dir1', '.git']);

		emptyDir('my-dir');

		expect(fs.rmSync).toHaveBeenCalledWith(path.resolve('my-dir', 'file1.txt'), { recursive: true, force: true });
		expect(fs.rmSync).toHaveBeenCalledWith(path.resolve('my-dir', 'dir1'), { recursive: true, force: true });
		expect(fs.rmSync).not.toHaveBeenCalledWith(path.resolve('my-dir', '.git'), expect.anything());
	});
});
