import dotenv from 'dotenv';
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

	describe('when the existing .env already sets a target', () => {
		const placeholder = 'your-fabric.harper.fast-cluster-url-here';
		const mockFiles = (existing) => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockImplementation((path) => {
				if (path === 'template.env') { return `HARPER_CLI_TARGET='${placeholder}'\nNEW_VAR=value\n`; }
				if (path === '.env') { return existing; }
				return '';
			});
		};

		test.each([
			['HARPER_CLI_TARGET', "HARPER_CLI_TARGET='https://configured.example:9925/'"],
			['CLI_TARGET', "CLI_TARGET='https://configured.example:9925/'"],
			['an exported HARPER_CLI_TARGET', "export HARPER_CLI_TARGET='https://configured.example:9925/'"],
			['a HARPER_CLI_TARGET in dotenv colon form', 'HARPER_CLI_TARGET: https://configured.example:9925/'],
		])('keeps %s when no cluster URL was supplied', (_name, existing) => {
			mockFiles(existing);

			copyFile('template.env', '.env', { [placeholder]: 'YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE' });

			const written = vi.mocked(fs.writeFileSync).mock.calls[0][1];
			const env = dotenv.parse(written);
			expect(env.HARPER_CLI_TARGET || env.CLI_TARGET).toBe('https://configured.example:9925/');
			expect(written).not.toMatch(/URL_HERE/i);
			expect(env.NEW_VAR).toBe('value');
		});

		test('appends a supplied cluster URL that only resembles the placeholder', () => {
			mockFiles("CLI_TARGET='https://configured.example:9925/'");

			copyFile('template.env', '.env', { [placeholder]: 'https://fast-cluster-url-here.internal:9925/' });

			expect(vi.mocked(fs.writeFileSync).mock.calls[0][1]).toContain(
				"HARPER_CLI_TARGET='https://fast-cluster-url-here.internal:9925/'",
			);
		});

		test('appends the supplied cluster URL after the existing target, so it wins', () => {
			mockFiles("HARPER_CLI_TARGET='https://configured.example:9925/'");

			copyFile('template.env', '.env', { [placeholder]: 'https://new.example:9925/' });

			const written = vi.mocked(fs.writeFileSync).mock.calls[0][1];
			expect(written.indexOf("HARPER_CLI_TARGET='https://new.example:9925/'")).toBeGreaterThan(
				written.indexOf("HARPER_CLI_TARGET='https://configured.example:9925/'"),
			);
		});
	});

	test('does not mistake a target-like line inside a quoted value for a target', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockImplementation((path) => {
			if (path === 'template.env') { return "HARPER_CLI_TARGET='your-fabric.harper.fast-cluster-url-here'"; }
			if (path === '.env') { return 'NOTES="first line\nHARPER_CLI_TARGET=https://example.com\n"'; }
			return '';
		});

		copyFile('template.env', '.env', {
			'your-fabric.harper.fast-cluster-url-here': 'YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE',
		});

		expect(vi.mocked(fs.writeFileSync).mock.calls[0][1]).toContain(
			"HARPER_CLI_TARGET='YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE'",
		);
	});

	test('keeps the template target when the existing .env sets none', () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockImplementation((path) => {
			if (path === 'template.env') { return "HARPER_CLI_TARGET='your-fabric.harper.fast-cluster-url-here'"; }
			if (path === '.env') { return 'OLD_VAR=old_value'; }
			return '';
		});

		copyFile('template.env', '.env');

		expect(vi.mocked(fs.writeFileSync).mock.calls[0][1]).toContain(
			"HARPER_CLI_TARGET='your-fabric.harper.fast-cluster-url-here'",
		);
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
