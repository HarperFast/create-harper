import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isEmpty } from './isEmpty.js';

vi.mock('node:fs');

describe(isEmpty, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns true if directory is empty', () => {
		vi.mocked(fs.readdirSync).mockReturnValue([]);
		expect(isEmpty('dir')).toBe(true);
	});

	test('returns true if directory only contains .git', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['.git']);
		expect(isEmpty('dir')).toBe(true);
	});

	test('returns false if directory contains files', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['file.txt']);
		expect(isEmpty('dir')).toBe(false);
	});

	test('returns false if directory contains .git and other files', () => {
		vi.mocked(fs.readdirSync).mockReturnValue(['.git', 'file.txt']);
		expect(isEmpty('dir')).toBe(false);
	});
});
