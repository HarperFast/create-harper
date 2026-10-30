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

	test('says how to turn previews on, and that GitHub blocks their event on public repositories', () => {
		expect(helpMessage).toContain('"deploy:setup-previews"');
		expect(helpMessage).toContain('Harper 5.4');
		expect(helpMessage).toContain('pull_request_target');
		expect(helpMessage).toContain('December 2, 2026');
	});

	test('aligns each framework group into columns', () => {
		expect(helpMessage).toContain('vanilla-ts          vanilla');
		expect(helpMessage).toContain('react-ts            react               react-ts-ssr        react-ssr');
		expect(helpMessage).toContain('vue-ts              vue                 vue-ts-ssr          vue-ssr');
	});
});
