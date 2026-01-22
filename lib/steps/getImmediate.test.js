import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getRunAppImmediately } from './getRunAppImmediately.js';

vi.mock('@clack/prompts');

describe('getImmediate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('uses argImmediate if provided', async () => {
		const result = await getRunAppImmediately(true, false, 'npm');
		expect(result).toEqual({
			immediate: true,
			cancelled: false,
		});
	});

	test('uses false if not interactive and no argImmediate', async () => {
		const result = await getRunAppImmediately(undefined, false, 'npm');
		expect(result).toEqual({
			immediate: false,
			cancelled: false,
		});
	});

	test('prompts if interactive and no argImmediate', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		const result = await getRunAppImmediately(undefined, true, 'npm');
		expect(prompts.confirm).toHaveBeenCalled();
		expect(result).toEqual({
			immediate: true,
			cancelled: false,
		});
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await getRunAppImmediately(undefined, true, 'npm');
		expect(result.cancelled).toBe(true);
	});
});
