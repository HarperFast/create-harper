import { describe, expect, test } from 'vitest';
import { getRunCommand } from './getRunCommand.js';

describe(getRunCommand, () => {
	test('returns agent script for yarn', () => {
		expect(getRunCommand('yarn', 'dev')).toEqual(['yarn', 'dev']);
	});

	test('returns agent script for pnpm', () => {
		expect(getRunCommand('pnpm', 'dev')).toEqual(['pnpm', 'dev']);
	});

	test('returns agent script for bun', () => {
		expect(getRunCommand('bun', 'dev')).toEqual(['bun', 'dev']);
	});

	test('returns agent task script for deno', () => {
		expect(getRunCommand('deno', 'dev')).toEqual(['deno', 'task', 'dev']);
	});

	test('returns agent run script for npm', () => {
		expect(getRunCommand('npm', 'dev')).toEqual(['npm', 'run', 'dev']);
	});

	test('returns agent run script for unknown agent', () => {
		expect(getRunCommand('unknown', 'dev')).toEqual(['unknown', 'run', 'dev']);
	});
});
