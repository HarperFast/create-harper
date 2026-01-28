import { describe, expect, test } from 'vitest';
import { parseArgv } from './parseArgv.js';

describe('parseArgv', () => {
	test('parses standard flags', () => {
		const result = parseArgv(['--template', 'vanilla', '--interactive', '--overwrite']);
		expect(result.template).toBe('vanilla');
		expect(result.interactive).toBe(true);
		expect(result.overwrite).toBe(true);
	});

	test('parses aliased flags', () => {
		const result = parseArgv(['-t', 'react', '-i', '-v']);
		expect(result.template).toBe('react');
		expect(result.immediate).toBe(true);
		expect(result.version).toBe(true);
	});

	test('parses target directory as positional argument', () => {
		const result = parseArgv(['my-app']);
		expect(result.targetDir).toBe('my-app');
	});

	test('detects help from positional arguments', () => {
		const result = parseArgv(['help']);
		expect(result.help).toBe(true);
		expect(result.targetDir).toBeUndefined();
	});

	test('detects version from positional arguments', () => {
		const result = parseArgv(['version']);
		expect(result.version).toBe(true);
		expect(result.targetDir).toBeUndefined();
	});

	test('detects template from positional arguments', () => {
		const result = parseArgv(['template', 'vanilla-ts']);
		expect(result.template).toBe('vanilla-ts');
		expect(result.targetDir).toBeUndefined();
	});

	test('handles mixed positional and flags', () => {
		const result = parseArgv(['help', 'template', 'yay']);
		expect(result.help).toBe(true);
		expect(result.template).toBe('yay');
		expect(result.targetDir).toBeUndefined();
	});

	test('handles positional help with target dir', () => {
		const result = parseArgv(['my-app', 'help']);
		expect(result.help).toBe(true);
		expect(result.targetDir).toBe('my-app');
	});

	test('handles positional template with target dir', () => {
		const result = parseArgv(['my-app', 'template', 'react-ts']);
		expect(result.targetDir).toBe('my-app');
		expect(result.template).toBe('react-ts');
	});

	test('parses deployment flags and aliases', () => {
		const result1 = parseArgv([
			'--deploymentURL',
			'https://example.com',
			'--deploymentUsername',
			'my-user',
		]);
		expect(result1.deploymentURL).toBe('https://example.com');
		expect(result1.deploymentUsername).toBe('my-user');

		const result2 = parseArgv([
			'--deployment-url',
			'https://example.com',
			'--deployment-username',
			'my-user',
		]);
		expect(result2.deploymentURL).toBe('https://example.com');
		expect(result2.deploymentUsername).toBe('my-user');

		const result3 = parseArgv([
			'-c',
			'https://example.com',
			'-u',
			'my-user',
		]);
		expect(result3.deploymentURL).toBe('https://example.com');
		expect(result3.deploymentUsername).toBe('my-user');
	});

	test('parses --skipInstall and its aliases', () => {
		expect(parseArgv(['--skipInstall']).skipInstall).toBe(true);
		expect(parseArgv(['--skip-install']).skipInstall).toBe(true);
		expect(parseArgv(['-s']).skipInstall).toBe(true);
	});

	test('parses additional single-letter aliases', () => {
		expect(parseArgv(['-o']).overwrite).toBe(true);
		expect(parseArgv(['-h']).help).toBe(true);
	});
});
