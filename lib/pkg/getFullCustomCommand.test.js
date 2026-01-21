import { describe, expect, test } from 'vitest';
import { getFullCustomCommand } from './getFullCustomCommand.js';

describe(getFullCustomCommand, () => {
	test('npm create with npm', () => {
		expect(getFullCustomCommand('npm create harper@latest', { name: 'npm', version: '10.0.0' })).toBe(
			'npm create harper@latest',
		);
	});

	test('npm create -- with npm', () => {
		expect(getFullCustomCommand('npm create -- harper@latest', { name: 'npm', version: '10.0.0' })).toBe(
			'npm create -- harper@latest',
		);
	});

	test('npm create with yarn v1', () => {
		expect(getFullCustomCommand('npm create harper@latest', { name: 'yarn', version: '1.22.19' })).toBe(
			'yarn create harper',
		);
	});

	test('npm create with yarn v2+', () => {
		expect(getFullCustomCommand('npm create harper@latest', { name: 'yarn', version: '3.0.0' })).toBe(
			'yarn create harper@latest',
		);
	});

	test('npm create with pnpm', () => {
		expect(getFullCustomCommand('npm create harper@latest', { name: 'pnpm', version: '8.0.0' })).toBe(
			'pnpm create harper@latest',
		);
	});

	test('npm create -- with pnpm', () => {
		expect(getFullCustomCommand('npm create -- harper@latest', { name: 'pnpm', version: '8.0.0' })).toBe(
			'pnpm create harper@latest',
		);
	});

	test('npm create with bun', () => {
		expect(getFullCustomCommand('npm create harper@latest', { name: 'bun', version: '1.0.0' })).toBe(
			'bun x create-harper@latest',
		);
	});

	test('npm create with deno', () => {
		expect(getFullCustomCommand('npm create harper@latest', { name: 'deno', version: '1.37.0' })).toBe(
			'deno run -A npm:create-harper@latest',
		);
	});

	test('npm exec with npm', () => {
		expect(getFullCustomCommand('npm exec harper', { name: 'npm', version: '10.0.0' })).toBe('npm exec harper');
	});

	test('npm exec with yarn v1', () => {
		expect(getFullCustomCommand('npm exec harper', { name: 'yarn', version: '1.22.19' })).toBe('npm exec harper');
	});

	test('npm exec with yarn v2+', () => {
		expect(getFullCustomCommand('npm exec harper', { name: 'yarn', version: '3.0.0' })).toBe('yarn dlx harper');
	});

	test('npm exec with pnpm', () => {
		expect(getFullCustomCommand('npm exec harper', { name: 'pnpm', version: '8.0.0' })).toBe('pnpm dlx harper');
	});

	test('npm exec with bun', () => {
		expect(getFullCustomCommand('npm exec harper', { name: 'bun', version: '1.0.0' })).toBe('bun x harper');
	});

	test('npm exec with deno', () => {
		expect(getFullCustomCommand('npm exec harper', { name: 'deno', version: '1.37.0' })).toBe('deno run -A npm:harper');
	});

	test('defaults to npm when pkgInfo is missing', () => {
		expect(getFullCustomCommand('npm create harper@latest')).toBe('npm create harper@latest');
	});
});
