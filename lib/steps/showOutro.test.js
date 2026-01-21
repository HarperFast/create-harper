import * as prompts from '@clack/prompts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { install } from '../install.js';
import { start } from '../start.js';
import { showOutro } from './showOutro.js';

vi.mock('@clack/prompts');
vi.mock('../install.js');
vi.mock('../start.js');
vi.mock('../pkg/getInstallCommand.js', () => ({
	getInstallCommand: vi.fn(() => ['npm', 'install']),
}));
vi.mock('../pkg/getRunCommand.js', () => ({
	getRunCommand: vi.fn(() => ['npm', 'run', 'dev']),
}));

describe('showOutro', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('calls install and start if immediate is true', () => {
		showOutro('/root', 'npm', true);
		expect(install).toHaveBeenCalledWith('/root', 'npm');
		expect(start).toHaveBeenCalledWith('/root', 'npm');
	});

	test('calls prompts.outro if immediate is false', () => {
		showOutro('/root', 'npm', false);
		expect(prompts.outro).toHaveBeenCalled();
		expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining('Done. Now run:'));
	});
});
