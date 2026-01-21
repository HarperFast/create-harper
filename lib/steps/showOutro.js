import * as prompts from '@clack/prompts';
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
 */
export function showOutro(root, pkgManager, immediate) {
	if (immediate) {
		install(root, pkgManager);
		start(root, pkgManager);
	} else {
		let doneMessage = '';
		const cwd = process.cwd();
		const cdProjectName = path.relative(cwd, root);
		doneMessage += `Done. Now run:\n`;
		if (root !== cwd) {
			doneMessage += `\n  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`;
		}
		doneMessage += `\n  ${getInstallCommand(pkgManager).join(' ')}`;
		doneMessage += `\n  ${getRunCommand(pkgManager, 'dev').join(' ')}`;
		prompts.outro(doneMessage);
	}
}
