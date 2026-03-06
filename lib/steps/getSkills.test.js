import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getSkills } from './getSkills.js';

vi.mock('@clack/prompts');

describe('getSkills', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns default if not interactive and no args', async () => {
		const result = await getSkills(false);
		expect(result).toEqual({
			selectedSkills: ['*'],
			selectedAgents: [],
			cancelled: false,
		});
	});

	test('returns empty if skipSkills is true', async () => {
		const result = await getSkills(true, undefined, undefined, true);
		expect(result).toEqual({
			selectedSkills: [],
			selectedAgents: [],
			cancelled: false,
		});
	});

	test('returns parsed skills and agents from args', async () => {
		const result = await getSkills(false, 'skill1,skill2', 'agent1,agent2');
		expect(result).toEqual({
			selectedSkills: ['skill1', 'skill2'],
			selectedAgents: ['agent1', 'agent2'],
			cancelled: false,
		});
	});

	test('prompts user in interactive mode', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		vi.mocked(prompts.multiselect).mockResolvedValue(['cursor', 'windsurf']);

		const result = await getSkills(true);

		expect(prompts.confirm).toHaveBeenCalled();
		expect(prompts.multiselect).toHaveBeenCalled();
		expect(result).toEqual({
			selectedSkills: ['*'],
			selectedAgents: ['cursor', 'windsurf'],
			cancelled: false,
		});
	});

	test('returns empty if user says no to skills', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(false);

		const result = await getSkills(true);

		expect(prompts.confirm).toHaveBeenCalled();
		expect(prompts.multiselect).not.toHaveBeenCalled();
		expect(result).toEqual({
			selectedSkills: [],
			selectedAgents: [],
			cancelled: false,
		});
	});

	test('handles all agents selection', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		vi.mocked(prompts.multiselect).mockResolvedValue(['all']);

		const result = await getSkills(true);

		expect(result.selectedAgents).toEqual(['*']);
	});

	test('handles auto agents selection', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		vi.mocked(prompts.multiselect).mockResolvedValue(['auto']);

		const result = await getSkills(true);

		expect(result.selectedAgents).toEqual([]);
	});

	test('returns cancelled if confirm is cancelled', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(Symbol('clack-cancel'));
		vi.mocked(prompts.isCancel).mockReturnValue(true);

		const result = await getSkills(true);

		expect(result.cancelled).toBe(true);
	});

	test('returns cancelled if multiselect is cancelled', async () => {
		vi.mocked(prompts.confirm).mockResolvedValue(true);
		vi.mocked(prompts.multiselect).mockResolvedValue(Symbol('clack-cancel'));
		vi.mocked(prompts.isCancel).mockImplementation((val) => typeof val === 'symbol');

		const result = await getSkills(true);

		expect(result.cancelled).toBe(true);
	});
});
