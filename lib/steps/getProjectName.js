import * as prompts from '@clack/prompts';
import { defaultTargetDir } from '../constants/defaultTargetDir.js';
import { formatTargetDir } from '../fs/formatTargetDir.js';

/**
 * Step 1: Get the project name and target directory from the user or arguments.
 *
 * @param {string | undefined} argTargetDir - The target directory provided via CLI arguments.
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @returns {Promise<{projectName: string, targetDir: string, cancelled: boolean}>} - The project name, target directory, and cancellation status.
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
