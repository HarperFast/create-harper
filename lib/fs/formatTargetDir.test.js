import { describe, expect, test } from 'vitest';
import { formatTargetDir } from './formatTargetDir.js';

describe(formatTargetDir, () => {
	test('trims whitespace', () => {
		expect(formatTargetDir('  my-dir  ')).toBe('my-dir');
	});

	test('removes trailing slashes', () => {
		expect(formatTargetDir('my-dir/')).toBe('my-dir');
		expect(formatTargetDir('my-dir///')).toBe('my-dir');
	});

	test('handles both whitespace and trailing slashes', () => {
		expect(formatTargetDir('  my-dir/  ')).toBe('my-dir');
	});
});
