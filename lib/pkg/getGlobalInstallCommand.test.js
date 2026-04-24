import { describe, expect, test } from 'vitest';
import { getGlobalInstallCommand } from './getGlobalInstallCommand.js';

describe(getGlobalInstallCommand, () => {
	test('returns npm install -g for npm agent', () => {
		expect(getGlobalInstallCommand('npm', 'harper')).toEqual(['npm', 'install', '-g', 'harper']);
	});

	test('returns pnpm add -g for pnpm agent', () => {
		expect(getGlobalInstallCommand('pnpm', 'harper')).toEqual(['pnpm', 'add', '-g', 'harper']);
	});

	test('returns yarn global add for yarn agent', () => {
		expect(getGlobalInstallCommand('yarn', 'harper')).toEqual(['yarn', 'global', 'add', 'harper']);
	});

	test('returns bun add -g for bun agent', () => {
		expect(getGlobalInstallCommand('bun', 'harper')).toEqual(['bun', 'add', '-g', 'harper']);
	});

	test('returns agent install -g for unknown agent', () => {
		expect(getGlobalInstallCommand('unknown', 'harper')).toEqual(['unknown', 'install', '-g', 'harper']);
	});
});
