import { describe, expect, test } from 'vitest';
import { pkgFromUserAgent } from './pkgFromUserAgent.js';

describe(pkgFromUserAgent, () => {
	test('parses npm user agent', () => {
		expect(pkgFromUserAgent('npm/10.0.0 node/v20.0.0 darwin x64')).toEqual({
			name: 'npm',
			version: '10.0.0',
		});
	});

	test('parses yarn user agent', () => {
		expect(pkgFromUserAgent('yarn/1.22.19 npm/? node/v20.0.0 darwin x64')).toEqual({
			name: 'yarn',
			version: '1.22.19',
		});
	});

	test('parses pnpm user agent', () => {
		expect(pkgFromUserAgent('pnpm/8.0.0 npm/? node/v20.0.0 darwin x64')).toEqual({
			name: 'pnpm',
			version: '8.0.0',
		});
	});

	test('parses bun user agent', () => {
		expect(pkgFromUserAgent('bun/1.0.0 npm/? node/v20.0.0 darwin x64')).toEqual({
			name: 'bun',
			version: '1.0.0',
		});
	});

	test('parses deno user agent', () => {
		expect(pkgFromUserAgent('deno/1.40.0 npm/? node/v20.0.0 darwin x64')).toEqual({
			name: 'deno',
			version: '1.40.0',
		});
	});

	test('returns undefined for missing user agent', () => {
		expect(pkgFromUserAgent(undefined)).toBeUndefined();
	});
});
