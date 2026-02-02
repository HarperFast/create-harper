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

	test('appends to existing .env files', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockImplementation((path) => {
			if (path === 'template.env') { return 'NEW_VAR=value'; }
			if (path === '.env') { return 'OLD_VAR=old_value'; }
			return '';
		});

		copyFile('template.env', '.env');

		const expectedContent = `# Your .env file contents:
OLD_VAR=old_value

# Harper .env contents:
NEW_VAR=value`;

		expect(fs.writeFileSync).toHaveBeenCalledWith('.env', expectedContent);
	});

	test('does not append if .env file does not exist', () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		vi.mocked(fs.readFileSync).mockReturnValue('NEW_VAR=value');

		copyFile('template.env', '.env');

		expect(fs.writeFileSync).toHaveBeenCalledWith('.env', 'NEW_VAR=value');
	});

	test('appends to existing .env files with different names', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockImplementation((path) => {
			if (path === 'template.env') { return 'NEW_VAR=value'; }
			if (path === 'production.env') { return 'OLD_VAR=old_value'; }
			return '';
		});

		copyFile('template.env', 'production.env');

		const expectedContent = `# Your .env file contents:
OLD_VAR=old_value

# Harper .env contents:
NEW_VAR=value`;

		expect(fs.writeFileSync).toHaveBeenCalledWith('production.env', expectedContent);
	});

	test('does not append to existing non-.env files', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockImplementation((path) => {
			if (path === 'template.txt') { return 'NEW_CONTENT'; }
			if (path === 'target.txt') { return 'OLD_CONTENT'; }
			return '';
		});

		copyFile('template.txt', 'target.txt');

		expect(fs.writeFileSync).toHaveBeenCalledWith('target.txt', 'NEW_CONTENT');
	});
});
