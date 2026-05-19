import * as prompts from '@clack/prompts';
import spawn from 'cross-spawn';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'picocolors';
import { defaultTarget } from '../constants/defaultEnv.js';

const {
	gray,
	magenta,
} = colors;

/**
 * @typedef {Object} EnvVars
 * @property {string} [target] - The HarperDB cluster URL.
 */

/**
 * Step 5: Get environment variables for the .env file, optionally prompting the user.
 *
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @param {string} template - The selected template name.
 * @param {string} [argDeploymentURL] - The deployment URL specified in the command line args.
 * @returns {Promise<{envVars: EnvVars, cancelled: boolean}>} - The environment variables and cancellation status.
 */
export async function getEnvVars(interactive, template, argDeploymentURL) {
	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'..',
		'..',
		'..',
		`template-${template}`,
	);
	const hasEnvFile = fs.existsSync(path.join(templateDir, '_env'));

	if (!hasEnvFile) {
		return {
			envVars: {},
			cancelled: false,
		};
	}

	let target = argDeploymentURL;

	const prefix = gray('https://') + magenta('fabric.harper.fast') + gray('/') + ' Cluster ';

	if (interactive) {
		if (!target) {
			const targetResult = await prompts.text({
				message: prefix + 'URL (Optional):',
				placeholder: 'YOUR_CLUSTER_URL_HERE',
			});

			if (prompts.isCancel(targetResult)) {
				return { envVars: {}, cancelled: true };
			}
			target = targetResult;
		}
	}

	if (target) {
		if (!target.startsWith('http://') && !target.startsWith('https://')) {
			target = 'https://' + target;
		}

		try {
			const url = new URL(target);
			if (!url.port) {
				url.port = '9925';
			}
			target = url.toString();
		} catch {
			// If it's not a valid URL yet, we'll let it be handled later or it will fail
		}

		if (!target.endsWith('/')) {
			target = target + '/';
		}
	}

	if (interactive) {
		if (target && target !== defaultTarget) {
			const loginResult = await prompts.confirm({
				message: 'Would you like to login to this cluster now?',
				initialValue: true,
			});

			if (prompts.isCancel(loginResult)) {
				return { envVars: {}, cancelled: true };
			}

			if (loginResult) {
				const loginProcess = spawn.sync('harper', ['login', target], { stdio: 'inherit' });
				if (loginProcess.status !== 0) {
					prompts.log.error('Failed to login to Harper. You can try again later with "harper login".');
				}
			}
		}
	}

	return {
		envVars: {
			target: target || defaultTarget,
		},
		cancelled: false,
	};
}
