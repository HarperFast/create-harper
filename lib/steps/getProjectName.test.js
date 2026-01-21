import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defaultTargetDir } from '../constants/defaultTargetDir.js';
import { getProjectName } from './getProjectName.js';

vi.mock('@clack/prompts');

describe('getProjectName', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('uses argTargetDir if provided', async () => {
		const result = await getProjectName('my-project', false);
		expect(result).toEqual({
			projectName: 'my-project',
			targetDir: 'my-project',
			cancelled: false,
		});
		expect(prompts.text).not.toHaveBeenCalled();
	});

	test('uses defaultTargetDir if not interactive and no argTargetDir', async () => {
		const result = await getProjectName(undefined, false);
		expect(result).toEqual({
			projectName: defaultTargetDir,
			targetDir: defaultTargetDir,
			cancelled: false,
		});
	});

	test('prompts for project name if interactive and no argTargetDir', async () => {
		vi.mocked(prompts.text).mockResolvedValue('new-project');
		const result = await getProjectName(undefined, true);
		expect(prompts.text).toHaveBeenCalled();
		expect(result).toEqual({
			projectName: 'new-project',
			targetDir: 'new-project',
			cancelled: false,
		});
	});

	test('formats target dir from prompt', async () => {
		vi.mocked(prompts.text).mockResolvedValue('  new-project///  ');
		const result = await getProjectName(undefined, true);
		expect(result.targetDir).toBe('new-project');
	});

	test('returns cancelled: true if prompt is cancelled', async () => {
		vi.mocked(prompts.text).mockResolvedValue(Symbol('cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);
		const result = await getProjectName(undefined, true);
		expect(result.cancelled).toBe(true);
	});
});
