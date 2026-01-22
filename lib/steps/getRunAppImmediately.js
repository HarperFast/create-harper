import * as prompts from '@clack/prompts';

/**
 * Step 5 (Optional): Ask the user if they want to immediately install dependencies and start the dev server.
 *
 * @param {boolean | undefined} argImmediate - The immediate flag provided via CLI arguments.
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @param {string} pkgManager - The detected package manager.
 * @returns {Promise<{immediate: boolean, cancelled: boolean}>} - The immediate flag and cancellation status.
 */
export async function getRunAppImmediately(argImmediate, interactive, pkgManager) {
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
