import { describe, expect, it } from 'vitest';
import { isVersionNewer } from './isVersionNewer.js';

describe('isVersionNewer', () => {
	it('should return true if latest major version is newer', () => {
		expect(isVersionNewer('2.0.0', '1.0.0')).toBe(true);
		expect(isVersionNewer('2.0.0', '1.9.9')).toBe(true);
	});

	it('should return true if latest minor version is newer', () => {
		expect(isVersionNewer('1.1.0', '1.0.0')).toBe(true);
		expect(isVersionNewer('1.1.0', '1.0.9')).toBe(true);
	});

	it('should return true if latest patch version is newer', () => {
		expect(isVersionNewer('1.0.1', '1.0.0')).toBe(true);
	});

	it('should return false if versions are the same', () => {
		expect(isVersionNewer('1.0.0', '1.0.0')).toBe(false);
		expect(isVersionNewer('2.1.3', '2.1.3')).toBe(false);
	});

	it('should return false if current version is newer', () => {
		expect(isVersionNewer('1.0.0', '2.0.0')).toBe(false);
		expect(isVersionNewer('1.0.0', '1.1.0')).toBe(false);
		expect(isVersionNewer('1.0.0', '1.0.1')).toBe(false);
	});

	it('should handle versions with different lengths or invalid formats', () => {
		expect(isVersionNewer('1.1', '1.0.0')).toBe(true);
		expect(isVersionNewer('1.0.0', '1.1')).toBe(false);
		expect(isVersionNewer('1.0.0', '1')).toBe(false);
		expect(isVersionNewer('1', '1.0.0')).toBe(false);
		expect(isVersionNewer('invalid', '1.0.0')).toBe(false);
	});

	it('should handle pre-release or build metadata by ignoring it (as per current implementation)', () => {
		// The current implementation uses split('.') and parseInt, which will stop at non-digit characters for each segment
		// e.g. "1.0.0-alpha" split by '.' is ["1", "0", "0-alpha"]. parseInt("0-alpha") is 0.
		expect(isVersionNewer('1.0.1-alpha', '1.0.0')).toBe(true);
		expect(isVersionNewer('1.0.0', '0.9.9-beta')).toBe(true);
	});
});
