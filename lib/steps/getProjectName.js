import * as prompts from '@clack/prompts';
import { defaultTargetDir } from '../constants/defaultTargetDir.js';
import { formatTargetDir } from '../fs/formatTargetDir.js';

/**
 * Step 1: Get project name and target directory
 * @param {string | undefined} argTargetDir
 * @param {boolean} interactive
 * @returns {Promise<{projectName: string, targetDir: string, cancelled: boolean}>}
 */
export async function getProjectName(argTargetDir, interactive) {
	let targetDir = argTargetDir;
	let projectName = targetDir;

	if (!targetDir) {
		if (interactive) {
			projectName = await prompts.text({
				message: 'Project name:',
				defaultValue: defaultTargetDir,
				placeholder: defaultTargetDir,
				validate: (value) => {
					return !value || formatTargetDir(value).length > 0
						? undefined
						: 'Invalid project name';
				},
			});

			if (prompts.isCancel(projectName)) {
				return { projectName: '', targetDir: '', cancelled: true };
			}

			targetDir = formatTargetDir(projectName);
		} else {
			targetDir = defaultTargetDir;
			projectName = targetDir;
		}
	}

	return { projectName, targetDir, cancelled: false };
}
