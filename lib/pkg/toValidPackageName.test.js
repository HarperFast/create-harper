import { describe, expect, test } from 'vitest';
import { toValidPackageName } from './toValidPackageName.js';

describe(toValidPackageName, () => {
	test('converts to lowercase', () => {
		expect(toValidPackageName('MyPackage')).toBe('mypackage');
	});

	test('trims whitespace', () => {
		expect(toValidPackageName('  my-package  ')).toBe('my-package');
	});

	test('replaces spaces with dashes', () => {
		expect(toValidPackageName('my package')).toBe('my-package');
	});

	test('removes leading dots and underscores', () => {
		expect(toValidPackageName('.my-package')).toBe('my-package');
		expect(toValidPackageName('_my-package')).toBe('my-package');
	});

	test('replaces invalid characters with dashes', () => {
		expect(toValidPackageName('my!package')).toBe('my-package');
		expect(toValidPackageName('my@package')).toBe('my-package');
	});

	test('handles multiple spaces and invalid characters', () => {
		expect(toValidPackageName('  My   Package!  ')).toBe('my-package');
	});
});
