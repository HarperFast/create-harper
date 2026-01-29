import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { copyDir } from './copyDir.js';
import { copyFile } from './copyFile.js';

vi.mock('node:fs');
vi.mock('./copyFile.js');

describe(copyDir, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('creates destination directory and copies contents', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['file1.txt', 'subdir']);
		vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false });

		copyDir('src-dir', 'dest-dir');

		expect(fs.mkdirSync).toHaveBeenCalledWith('dest-dir', { recursive: true });
		expect(copyFile).toHaveBeenCalledWith(
			path.resolve('src-dir', 'file1.txt'),
			path.resolve('dest-dir', 'file1.txt'),
			undefined,
		);
		expect(copyFile).toHaveBeenCalledWith(
			path.resolve('src-dir', 'subdir'),
			path.resolve('dest-dir', 'subdir'),
			undefined,
		);
	});

	test('skips files when filter returns false', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['file1.txt', 'skip-me.txt']);
		vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false });
		const filter = (src) => !src.includes('skip-me');

		copyDir('src-dir', 'dest-dir', filter);

		expect(copyFile).toHaveBeenCalledWith(
			path.resolve('src-dir', 'file1.txt'),
			path.resolve('dest-dir', 'file1.txt'),
			undefined,
		);
		expect(copyFile).not.toHaveBeenCalledWith(
			path.resolve('src-dir', 'skip-me.txt'),
			path.resolve('dest-dir', 'skip-me.txt'),
			undefined,
		);
	});

	test('passes substitutions to copyFile', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['file1.txt']);
		vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false });
		const substitutions = { 'key': 'value' };

		copyDir('src-dir', 'dest-dir', undefined, substitutions);

		expect(copyFile).toHaveBeenCalledWith(
			path.resolve('src-dir', 'file1.txt'),
			path.resolve('dest-dir', 'file1.txt'),
			substitutions,
		);
	});

	test('recursively copies directories', () => {
		vi.mocked(fs.readdirSync)
			.mockReturnValueOnce(['subdir'])
			.mockReturnValueOnce(['file1.txt']);

		vi.mocked(fs.lstatSync)
			.mockReturnValueOnce({ isDirectory: () => true })
			.mockReturnValueOnce({ isDirectory: () => false });

		const substitutions = { 'key': 'value' };
		copyDir('src-dir', 'dest-dir', undefined, substitutions);

		expect(fs.mkdirSync).toHaveBeenCalledWith('dest-dir', { recursive: true });
		expect(fs.mkdirSync).toHaveBeenCalledWith(path.resolve('dest-dir', 'subdir'), { recursive: true });
		expect(copyFile).toHaveBeenCalledWith(
			path.resolve('src-dir', 'subdir', 'file1.txt'),
			path.resolve('dest-dir', 'subdir', 'file1.txt'),
			substitutions,
		);
	});
});
