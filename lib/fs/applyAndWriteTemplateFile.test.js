import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { applyAndWriteTemplateFile } from './applyAndWriteTemplateFile.js';

vi.mock('node:fs');

describe(applyAndWriteTemplateFile, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('replaces substitutions and writes to target file', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('Hello NAME!');

		applyAndWriteTemplateFile('target.txt', 'template.txt', { NAME: 'World' });

		expect(fs.readFileSync).toHaveBeenCalledWith('template.txt', 'utf-8');
		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Hello World!');
	});

	test('handles multiple substitutions', () => {
		vi.mocked(fs.readFileSync).mockReturnValue('NAME is AGE years old.');

		applyAndWriteTemplateFile('target.txt', 'template.txt', { NAME: 'Alice', AGE: '25' });

		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'Alice is 25 years old.');
	});
});
