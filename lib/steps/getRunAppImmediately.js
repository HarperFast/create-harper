import * as prompts from '@clack/prompts';
import spawn from 'cross-spawn';
import { getGlobalInstallCommand } from '../pkg/getGlobalInstallCommand.js';

/**
 * Step 5 (Optional): Ask the user if they want to immediately install dependencies and start the dev server.
 *
 * @param {boolean | undefined} argImmediate - The immediate flag provided via CLI arguments.
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @param {string} pkgManager - The detected package manager.
 * @returns {Promise<{immediate: boolean, cancelled: boolean}>} - The immediate flag and cancellation status.
 */
export async function getRunAppImmediately(argImmediate, interactive, pkgManager) {
	if (interactive) {
		const harperInstalled = spawn.sync('harper', ['--version'], { stdio: 'ignore' }).status === 0;
		if (!harperInstalled) {
			const shouldInstallHarper = await prompts.confirm({
				message: 'Harper CLI not found. Would you like to install it?',
				initialValue: true,
			});

			if (prompts.isCancel(shouldInstallHarper)) {
				return { immediate: false, cancelled: true };
			}

			if (shouldInstallHarper) {
				const installCommand = getGlobalInstallCommand(pkgManager, 'harperdb');
				prompts.log.step(`Installing Harper CLI with ${pkgManager}...`);
				const installResult = spawn.sync(installCommand[0], installCommand.slice(1), { stdio: 'inherit' });
				if (installResult.status === 0) {
					prompts.log.success('Harper CLI installed successfully.');
					prompts.log.step('Checking Harper status...');
					spawn.sync('harper', ['status'], { stdio: 'inherit' });
				} else {
					prompts.log.error('Failed to install Harper CLI.');
				}
			}
		}
	}

	let immediate = argImmediate;

	if (immediate === undefined) {
		if (interactive) {
			const immediateResult = await prompts.confirm({
				message: `Install with ${pkgManager} and start now?`,
			});

			if (prompts.isCancel(immediateResult)) {
				return { immediate: false, cancelled: true };
			}
			immediate = immediateResult;
		} else {
			immediate = false;
		}
	}

	return { immediate, cancelled: false };
}
