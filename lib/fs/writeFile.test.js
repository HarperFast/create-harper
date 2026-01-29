import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { writeFile } from './writeFile.js';

vi.mock('node:fs');

describe('writeFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('writes content to target file without substitutions', () => {
		writeFile('target.txt', 'Hello World!');
		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello World!');
	});

	test('replaces substitutions and writes to target file', () => {
		writeFile('target.txt', 'Hello NAME!', { NAME: 'World' });
		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello World!');
	});

	test('handles function as substitutions', () => {
		const substitutions = (content, targetPath) => {
			expect(targetPath).toBe('target.txt');
			return content.replace('World', 'Junie');
		};

		writeFile('target.txt', 'Hello World!', substitutions);
		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello Junie!');
	});

	test('handles empty substitutions object', () => {
		writeFile('target.txt', 'Hello World!', {});
		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello World!');
	});
});
