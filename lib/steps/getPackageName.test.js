import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getPackageName } from './getPackageName.js';

vi.mock('@clack/prompts');

describe('getPackageName', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('uses targetDir basename if it is a valid package name', async () => {
		const result = await getPackageName('my-project', false);
		expect(result).toEqual({
			packageName: 'my-project',
			cancelled: false,
		});
	});

	test('converts to valid package name if not interactive and invalid', async () => {
		const result = await getPackageName('My Project', false);
		expect(result).toEqual({
			packageName: 'my-project',
			cancelled: false,
		});
	});

	test('prompts if interactive and invalid', async () => {
		vi.mocked(prompts.text).mockResolvedValue('valid-pkg');
		const result = await getPackageName('My Project', true);
		expect(prompts.text).toHaveBeenCalled();
		expect(result).toEqual({
			packageName: 'valid-pkg',
			cancelled: false,
		});
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await getPackageName('My Project', true);
		expect(result.cancelled).toBe(true);
	});
});
