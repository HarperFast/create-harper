import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { copyFile } from './copyFile.js';
import { crawlTemplateDir } from './crawlTemplateDir.js';

vi.mock('node:fs');
vi.mock('./copyFile.js');

describe(crawlTemplateDir, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('recursively crawls template directory and applies templates', () => {
		vi.mocked(fs.readdirSync).mockImplementation((dir) => {
			if (dir === 'template-dir') { return ['file.txt', 'subdir', '_gitignore']; }
			if (dir === path.join('template-dir', 'subdir')) { return ['inner.txt']; }
			return [];
		});

		vi.mocked(fs.lstatSync).mockImplementation((p) => {
			if (p === path.join('template-dir', 'subdir')) { return { isDirectory: () => true }; }
			return { isDirectory: () => false };
		});

		crawlTemplateDir('target-dir', 'template-dir', { NAME: 'test' });

		expect(copyFile).toHaveBeenCalledWith(
			path.join('template-dir', 'file.txt'),
			path.join('target-dir', 'file.txt'),
			{ NAME: 'test' },
		);

		expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('target-dir', 'subdir'), { recursive: true });

		expect(copyFile).toHaveBeenCalledWith(
			path.join('template-dir', 'subdir', 'inner.txt'),
			path.join('target-dir', 'subdir', 'inner.txt'),
			{ NAME: 'test' },
		);

		expect(copyFile).toHaveBeenCalledWith(
			path.join('template-dir', '_gitignore'),
			path.join('target-dir', '.gitignore'),
			{ NAME: 'test' },
		);
	});
});
