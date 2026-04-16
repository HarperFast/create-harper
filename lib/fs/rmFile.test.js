import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { rmFile } from './rmFile.js';

vi.mock('node:fs');

describe('rmFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('removes a file at targetPath', () => {
		const targetPath = 'file-to-remove.txt';

		rmFile(targetPath);

		expect(fs.rmSync).toHaveBeenCalledWith(targetPath);
	});
});
