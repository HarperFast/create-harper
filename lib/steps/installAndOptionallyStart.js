import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { install } from '../install.js';
import { getInstallCommand } from '../pkg/getInstallCommand.js';
import { getRunCommand } from '../pkg/getRunCommand.js';
import { start } from '../start.js';

/**
 * Step 7: Display the final message and instructions to the user.
 *
 * @param {string} root - The absolute path to the project root.
 * @param {string} pkgManager - The detected or selected package manager.
 * @param {boolean} immediate - Whether to immediately install and start the project.
 * @param {boolean} skipInstall - Whether to skip the installation step.
 * @param {string[]} selectedSkills - The skills to install.
 * @param {string[]} selectedAgents - The agents to install skills to.
 */
export function installAndOptionallyStart(root, pkgManager, immediate, skipInstall, selectedSkills, selectedAgents) {
	if (!skipInstall) {
		install(root, pkgManager, selectedSkills, selectedAgents);
	}

	// The scaffolder can't do this setup itself: the GitHub repository rarely exists yet.
	if (fs.existsSync(path.join(root, '.github', 'workflows', 'deploy.yaml'))) {
		prompts.note(
			[
				'1. Push this project to a GitHub repository.',
				'2. Sign in to your cluster as a super user: harper login',
				`3. ${getRunCommand(pkgManager, 'deploy:setup-ci').join(' ')}`,
				'',
				'Then merging to main deploys. See "Deployment" in README.md.',
			].join('\n'),
			'Deploy from GitHub',
		);
	}

	if (immediate && !skipInstall) {
		start(root, pkgManager);
	} else {
		let doneMessage = '';
		const cwd = process.cwd();
		const cdProjectName = path.relative(cwd, root);
		doneMessage += `Done. Now run:\n`;
		if (root !== cwd) {
			doneMessage += `\n  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`;
		}
		if (skipInstall) {
			doneMessage += `\n  ${getInstallCommand(pkgManager).join(' ')}`;
		}
		doneMessage += `\n  ${getRunCommand(pkgManager, 'dev').join(' ')}`;
		prompts.outro(doneMessage);
	}
}
