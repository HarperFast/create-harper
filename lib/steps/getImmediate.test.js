import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getImmediate } from './getImmediate.js';

vi.mock('@clack/prompts');

describe('getImmediate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('uses argImmediate if provided', async () => {
		const result = await getImmediate(true, false, 'npm');
		expect(result).toEqual({
			immediate: true,
			cancelled: false,
		});
	});

	test('uses false if not interactive and no argImmediate', async () => {
		const result = await getImmediate(undefined, false, 'npm');
		expect(result).toEqual({
			immediate: false,
			cancelled: false,
		});
	});

	test('prompts if interactive and no argImmediate', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		const result = await getImmediate(undefined, true, 'npm');
		expect(prompts.confirm).toHaveBeenCalled();
		expect(result).toEqual({
			immediate: true,
			cancelled: false,
		});
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await getImmediate(undefined, true, 'npm');
		expect(result.cancelled).toBe(true);
	});
});
