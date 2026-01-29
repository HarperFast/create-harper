import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getOwnName, getOwnVersion } from './packageInformation.js';

vi.mock('node:fs');

describe('packageInformation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('getOwnName returns the name from package.json', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'create-harper' }));
		expect(getOwnName()).toBe('create-harper');
	});

	test('getOwnVersion returns the version from package.json', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.0.0' }));
		expect(getOwnVersion()).toBe('1.0.0');
	});

	test('getOwnName returns undefined if name is missing', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
		expect(getOwnName()).toBeUndefined();
	});

	test('getOwnName handles empty package.json contents', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('');
		expect(getOwnName()).toBeUndefined();
	});

	test('getOwnVersion handles empty package.json contents', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('');
		expect(getOwnVersion()).toBeUndefined();
	});
});
