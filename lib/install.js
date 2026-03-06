import * as prompts from '@clack/prompts';
import { getInstallCommand } from './pkg/getInstallCommand.js';
import { run } from './run.js';

/**
 * Installs dependencies for the project.
 *
 * @param {string} root - The root directory of the project.
 * @param {string} agent - The package manager agent (e.g., 'npm', 'pnpm', 'yarn', 'bun').
 * @param {string[]} [selectedSkills] - The skills to install.
 * @param {string[]} [selectedAgents] - The agents to install skills to.
 */
export function install(root, agent, selectedSkills = [], selectedAgents = []) {
	if (process.env._HARPER_TEST_CLI) {
		prompts.log.step(
			`Installing dependencies with ${agent}... (skipped in test)`,
		);
		return;
	}

	if (selectedSkills.length > 0) {
		prompts.log.step('Installing Harper skills...');

		const command = ['npx', '-y', 'skills', 'add', 'harperfast/skills'];

		if (selectedSkills.includes('*') && selectedAgents.includes('*')) {
			command.push('--all');
		} else {
			if (selectedSkills.length > 0) {
				command.push('--skill', ...selectedSkills);
			}
			if (selectedAgents.length > 0) {
				command.push('--agent', ...selectedAgents);
			}
			command.push('--yes');
		}

		run(command, {
			stdio: 'inherit',
			cwd: root,
		});
	}

	prompts.log.step(`Installing dependencies with ${agent}...`);
	run(getInstallCommand(agent), {
		stdio: 'inherit',
		cwd: root,
	});
}
