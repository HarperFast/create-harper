import * as prompts from '@clack/prompts';
import { getRunCommand } from './pkg/getRunCommand.js';
import { run } from './run.js';

/**
 * Starts the development server for the project.
 *
 * @param {string} root - The root directory of the project.
 * @param {string} agent - The package manager agent (e.g., 'npm', 'pnpm', 'yarn', 'bun').
 */
export function start(root, agent) {
	if (process.env._HARPER_TEST_CLI) {
		prompts.log.step('Starting dev server... (skipped in test)');
		return;
	}
	prompts.log.step('Starting dev server...');
	run(getRunCommand(agent, 'dev'), {
		stdio: 'inherit',
		cwd: root,
	});
}
