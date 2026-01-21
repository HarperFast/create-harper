import { describe, expect, test } from 'vitest';
import { helpMessage } from './helpMessage.js';

describe('helpMessage', () => {
	test('helpMessage is a string and contains usage information', () => {
		expect(typeof helpMessage).toBe('string');
		expect(helpMessage).toContain('Usage: create-harper');
		expect(helpMessage).toContain('Options:');
		expect(helpMessage).toContain('Available templates:');
	});
});
