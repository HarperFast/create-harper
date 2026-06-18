import { describe, expect, test } from 'vitest';
import { helpMessage } from './helpMessage.js';
import { templateNames } from './templates.js';

describe('helpMessage', () => {
	test('helpMessage is a string and contains usage information', () => {
		expect(typeof helpMessage).toBe('string');
		expect(helpMessage).toContain('Usage: create-harper');
		expect(helpMessage).toContain('All options are optional:');
		expect(helpMessage).toContain('Available templates:');
	});

	test('lists every template from the catalog', () => {
		for (const name of templateNames) {
			expect(helpMessage).toContain(name);
		}
	});

	test('aligns each framework group into columns', () => {
		expect(helpMessage).toContain('vanilla-ts          vanilla');
		expect(helpMessage).toContain('react-ts            react               react-ts-ssr        react-ssr');
		expect(helpMessage).toContain('vue-ts              vue                 vue-ts-ssr          vue-ssr');
	});
});
