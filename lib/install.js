import * as prompts from '@clack/prompts';
import { getInstallCommand } from './pkg/getInstallCommand.js';
import { run } from './run.js';

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
