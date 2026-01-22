import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { copyFile } from './copyFile.js';

vi.mock('node:fs');

describe(copyFile, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('replaces substitutions and writes to target file', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('Hello NAME!');

		copyFile('template.txt', 'target.txt', { NAME: 'World' });

		expect(fs.readFileSync).toHaveBeenCalledWith('template.txt', 'utf-8');
		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello World!');
	});

	test('handles multiple substitutions', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('NAME is AGE years old.');

		copyFile('template.txt', 'target.txt', { NAME: 'Alice', AGE: '25' });

		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Alice is 25 years old.');
	});

	test('handles function as substitutions', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('Hello World!');

		copyFile('template.txt', 'target.txt', (content) => content.replace('World', 'Junie'));

		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello Junie!');
	});
});
