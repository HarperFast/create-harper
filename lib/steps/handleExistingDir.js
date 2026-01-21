import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import { emptyDir } from '../fs/emptyDir.js';
import { isEmpty } from '../fs/isEmpty.js';

/**
 * Step 2: Handle directory if exist and not empty
 * @param {string} targetDir
 * @param {boolean | undefined} argOverwrite
 * @param {boolean} interactive
 * @returns {Promise<{cancelled: boolean}>}
 */
export async function handleExistingDir(targetDir, argOverwrite, interactive) {
	if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
		let overwrite = argOverwrite
			? 'yes'
			: undefined;

		if (!overwrite) {
			if (interactive) {
				const res = await prompts.select({
					message: (targetDir === '.'
						? 'Current directory'
						: `Target directory "${targetDir}"`)
						+ ` is not empty. Please choose how to proceed:`,
					options: [
						{
							label: 'Cancel operation',
							value: 'no',
						},
						{
							label: 'Remove existing files and continue',
							value: 'yes',
						},
						{
							label: 'Ignore files and continue',
							value: 'ignore',
						},
					],
				});

				if (prompts.isCancel(res)) {
					return { cancelled: true };
				}
				overwrite = res;
			} else {
				overwrite = 'no';
			}
		}

		switch (overwrite) {
			case 'yes':
				emptyDir(targetDir);
				break;
			case 'no':
				return { cancelled: true };
		}
	}

	return { cancelled: false };
}
