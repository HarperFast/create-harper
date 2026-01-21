import * as prompts from '@clack/prompts';

/**
 * Step 5: Ask about immediate install and package manager
 * @param {boolean | undefined} argImmediate
 * @param {boolean} interactive
 * @param {string} pkgManager
 * @returns {Promise<{immediate: boolean, cancelled: boolean}>}
 */
export async function getImmediate(argImmediate, interactive, pkgManager) {
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
