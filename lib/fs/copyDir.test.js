import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { copy } from './copy.js';
import { copyDir } from './copyDir.js';

vi.mock('node:fs');
vi.mock('./copy.js');

describe(copyDir, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('creates destination directory and copies contents', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['file1.txt', 'subdir']);

		copyDir('src-dir', 'dest-dir');

		expect(fs.mkdirSync).toHaveBeenCalledWith('dest-dir', { recursive: true });
		expect(copy).toHaveBeenCalledWith(path.resolve('src-dir', 'file1.txt'), path.resolve('dest-dir', 'file1.txt'));
		expect(copy).toHaveBeenCalledWith(path.resolve('src-dir', 'subdir'), path.resolve('dest-dir', 'subdir'));
	});
});
