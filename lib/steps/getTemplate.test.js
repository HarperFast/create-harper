import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TEMPLATES } from '../constants/templates.js';
import { getTemplate } from './getTemplate.js';

vi.mock('@clack/prompts');

describe('getTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('uses argTemplate if valid', async () => {
		const validTemplate = TEMPLATES[0];
		const result = await getTemplate(validTemplate, false);
		expect(result).toEqual({
			template: validTemplate,
			cancelled: false,
		});
	});

	test('uses default template if not interactive and no argTemplate', async () => {
		const result = await getTemplate(undefined, false);
		expect(result).toEqual({
			template: 'vanilla-ts',
			cancelled: false,
		});
	});

	test('prompts if interactive and no argTemplate', async () => {
		vi.mocked(prompts.select).mockResolvedValueOnce({
			variants: [{ name: 'v1', color: (s) => s }],
		});
		const result = await getTemplate(undefined, true);
		expect(prompts.select).toHaveBeenCalled();
		expect(result).toEqual({
			template: 'v1',
			cancelled: false,
		});
	});

	test('prompts for variant if multiple variants exist', async () => {
		vi.mocked(prompts.select)
			.mockResolvedValueOnce({
				variants: [
					{ name: 'v1', color: (s) => s },
					{ name: 'v2', color: (s) => s },
				],
			})
			.mockResolvedValueOnce('v2');
		const result = await getTemplate(undefined, true);
		expect(prompts.select).toHaveBeenCalledTimes(2);
		expect(result.template).toBe('v2');
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(prompts.select).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await getTemplate(undefined, true);
		expect(result.cancelled).toBe(true);
	});
});
