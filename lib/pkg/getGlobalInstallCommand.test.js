import { describe, expect, test } from 'vitest';
import { getGlobalInstallCommand } from './getGlobalInstallCommand.js';

describe(getGlobalInstallCommand, () => {
	test('returns npm install -g for npm agent', () => {
		expect(getGlobalInstallCommand('npm', 'harperdb')).toEqual(['npm', 'install', '-g', 'harperdb']);
	});

	test('returns pnpm add -g for pnpm agent', () => {
		expect(getGlobalInstallCommand('pnpm', 'harperdb')).toEqual(['pnpm', 'add', '-g', 'harperdb']);
	});

	test('returns yarn global add for yarn agent', () => {
		expect(getGlobalInstallCommand('yarn', 'harperdb')).toEqual(['yarn', 'global', 'add', 'harperdb']);
	});

	test('returns bun add -g for bun agent', () => {
		expect(getGlobalInstallCommand('bun', 'harperdb')).toEqual(['bun', 'add', '-g', 'harperdb']);
	});

	test('returns agent install -g for unknown agent', () => {
		expect(getGlobalInstallCommand('unknown', 'harperdb')).toEqual(['unknown', 'install', '-g', 'harperdb']);
	});
});
