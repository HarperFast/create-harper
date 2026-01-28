import { beforeEach, describe, expect, test, vi } from 'vitest';
import { install } from '../install.js';
import { start } from '../start.js';
import { installAndOptionallyStart } from './installAndOptionallyStart.js';

vi.mock('../install.js');
vi.mock('../start.js');
vi.mock('@clack/prompts');

describe('installAndOptionallyStart', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('installs dependencies', () => {
		installAndOptionallyStart('/root', 'npm', false);
		expect(install).toHaveBeenCalledWith('/root', 'npm');
		expect(start).not.toHaveBeenCalled();
	});

	test('installs and starts if immediate is true', () => {
		installAndOptionallyStart('/root', 'npm', true);
		expect(install).toHaveBeenCalledWith('/root', 'npm');
		expect(start).toHaveBeenCalledWith('/root', 'npm');
	});

	test('skips install if skipInstall is true', () => {
		installAndOptionallyStart('/root', 'npm', false, true);
		expect(install).not.toHaveBeenCalled();
		expect(start).not.toHaveBeenCalled();
	});

	test('skips install and start if skipInstall is true, even if immediate is true', () => {
		installAndOptionallyStart('/root', 'npm', true, true);
		expect(install).not.toHaveBeenCalled();
		expect(start).not.toHaveBeenCalled();
	});
});
