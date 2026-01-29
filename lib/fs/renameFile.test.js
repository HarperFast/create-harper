import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renameFile } from './renameFile.js';

vi.mock('node:fs');

describe('renameFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renames a file from source to target', () => {
		const source = 'old-name.txt';
		const target = 'new-name.txt';

		renameFile(source, target);

		expect(fs.renameSync).toHaveBeenCalledWith(source, target);
	});
});
