import { describe, expect, test } from 'vitest';
import { isValidPackageName } from './isValidPackageName.js';

describe(isValidPackageName, () => {
	test('returns true for valid package names', () => {
		expect(isValidPackageName('my-package')).toBe(true);
		expect(isValidPackageName('my_package')).toBe(true);
		expect(isValidPackageName('my.package')).toBe(true);
		expect(isValidPackageName('@scope/my-package')).toBe(true);
		expect(isValidPackageName('package123')).toBe(true);
	});

	test('returns false for invalid package names', () => {
		expect(isValidPackageName('MyPackage')).toBe(false);
		expect(isValidPackageName('my package')).toBe(false);
		expect(isValidPackageName('_package')).toBe(false);
		expect(isValidPackageName('.package')).toBe(false);
		expect(isValidPackageName('package/')).toBe(false);
		expect(isValidPackageName('@scope/')).toBe(false);
	});
});
