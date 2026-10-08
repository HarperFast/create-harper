import { describe, expect, test } from 'vitest';
import { toComponentName } from './toComponentName.js';

describe('toComponentName', () => {
	test('keeps a name Harper already accepts', () => {
		expect(toComponentName('my-app_2')).toBe('my-app_2');
	});

	test('replaces anything a shell or Harper would treat specially', () => {
		expect(toComponentName('my app')).toBe('my-app');
		expect(toComponentName('a; printf INJECTED')).toBe('a-printf-INJECTED');
		expect(toComponentName('$(touch x)')).toBe('touch-x');
		expect(toComponentName('@scope/pkg')).toBe('scope-pkg');
	});

	test('falls back when nothing usable is left', () => {
		expect(toComponentName('...')).toBe('app');
		expect(toComponentName('')).toBe('app');
	});
});
