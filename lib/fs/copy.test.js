import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { copy } from './copy.js';
import { copyDir } from './copyDir.js';

vi.mock('node:fs');
vi.mock('./copyDir.js');

describe(copy, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('copies file if source is a file', () => {
		vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false });
		copy('src-file', 'dest-file');
		expect(fs.copyFileSync).toHaveBeenCalledWith('src-file', 'dest-file');
		expect(copyDir).not.toHaveBeenCalled();
	});

	test('copies directory if source is a directory', () => {
		vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true });
		copy('src-dir', 'dest-dir');
		expect(copyDir).toHaveBeenCalledWith('src-dir', 'dest-dir');
		expect(fs.copyFileSync).not.toHaveBeenCalled();
	});
});
