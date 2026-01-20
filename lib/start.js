import * as prompts from '@clack/prompts';
import { getRunCommand } from './pkg/getRunCommand.js';
import { run } from './run.js';

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
