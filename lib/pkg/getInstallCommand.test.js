import { describe, expect, test } from 'vitest';
import { getInstallCommand } from './getInstallCommand.js';

describe(getInstallCommand, () => {
	test('returns yarn for yarn agent', () => {
		expect(getInstallCommand('yarn')).toEqual(['yarn']);
	});

	test('returns npm install for npm agent', () => {
		expect(getInstallCommand('npm')).toEqual(['npm', 'install']);
	});

	test('returns pnpm install for pnpm agent', () => {
		expect(getInstallCommand('pnpm')).toEqual(['pnpm', 'install']);
	});

	test('returns bun install for bun agent', () => {
		expect(getInstallCommand('bun')).toEqual(['bun', 'install']);
	});

	test('returns agent install for unknown agent', () => {
		expect(getInstallCommand('unknown')).toEqual(['unknown', 'install']);
	});
});
