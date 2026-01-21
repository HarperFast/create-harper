import { determineAgent } from '@vercel/detect-agent';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { helpAgents } from './helpAgents.js';

vi.mock('@vercel/detect-agent', () => ({
	determineAgent: vi.fn(),
}));

describe('helpAgents', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	test('logs helpful message if isAgent and interactive are true', async () => {
		vi.mocked(determineAgent).mockResolvedValue({ isAgent: true });
		await helpAgents(true);
		expect(console.log).toHaveBeenCalledWith(
			'\nTo create in one go, run: create-harper <DIRECTORY> --no-interactive --template <TEMPLATE>\n',
		);
	});

	test('does not log message if isAgent is true but interactive is false', async () => {
		vi.mocked(determineAgent).mockResolvedValue({ isAgent: true });
		await helpAgents(false);
		expect(console.log).not.toHaveBeenCalled();
	});

	test('does not log message if isAgent is false and interactive is true', async () => {
		vi.mocked(determineAgent).mockResolvedValue({ isAgent: false });
		await helpAgents(true);
		expect(console.log).not.toHaveBeenCalled();
	});

	test('does not log message if isAgent and interactive are false', async () => {
		vi.mocked(determineAgent).mockResolvedValue({ isAgent: false });
		await helpAgents(false);
		expect(console.log).not.toHaveBeenCalled();
	});
});
