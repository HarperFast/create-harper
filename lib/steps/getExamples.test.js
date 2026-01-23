import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getExamples } from './getExamples.js';

vi.mock('@clack/prompts');
vi.mock('node:fs');

describe('getExamples', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(prompts.isCancel).mockReturnValue(false);
	});

	test('returns empty excludedFiles if no examples found', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		const result = await getExamples('vanilla', true);
		expect(result).toEqual({ excludedFiles: [], cancelled: false });
	});

	test('returns empty excludedFiles if not interactive', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		const result = await getExamples('vanilla', false);
		expect(result).toEqual({ excludedFiles: [], cancelled: false });
	});

	test('prompts user if examples found and interactive', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(prompts.multiselect).mockResolvedValue(['socket', 'table']);
		const result = await getExamples('vanilla', true);

		expect(prompts.multiselect).toHaveBeenCalled();
		// Since we selected socket and table, and all 4 examples were available,
		// resource and tableSchema should be excluded.
		expect(result.excludedFiles).toContain('resources/greeting.ts');
		expect(result.excludedFiles).toContain('resources/greeting.js');
		expect(result.excludedFiles).toContain('schemas/examplePeople.graphql');
		expect(result.excludedFiles).not.toContain('resources/exampleSocket.ts');
		expect(result.excludedFiles).not.toContain('resources/exampleSocket.js');
		expect(result.excludedFiles).not.toContain('resources/examplePeople.ts');
		expect(result.excludedFiles).not.toContain('resources/examplePeople.js');
		expect(result.cancelled).toBe(false);
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(prompts.multiselect).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await getExamples('vanilla', true);
		expect(result.cancelled).toBe(true);
	});
});
