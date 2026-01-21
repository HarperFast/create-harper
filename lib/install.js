import * as prompts from '@clack/prompts';
import { getInstallCommand } from './pkg/getInstallCommand.js';
import { run } from './run.js';

/**
 * Installs dependencies for the project.
 *
 * @param {string} root - The root directory of the project.
 * @param {string} agent - The package manager agent (e.g., 'npm', 'pnpm', 'yarn', 'bun').
 */
export function install(root, agent) {
	if (process.env._HARPER_TEST_CLI) {
		prompts.log.step(
			`Installing dependencies with ${agent}... (skipped in test)`,
		);
		return;
	}
	prompts.log.step(`Installing dependencies with ${agent}...`);
	run(getInstallCommand(agent), {
		stdio: 'inherit',
		cwd: root,
	});
}
