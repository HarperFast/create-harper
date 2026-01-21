import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'picocolors';

const {
	gray,
	magenta,
} = colors;

/**
 * Step 5: Get environment variables for .env file
 * @param {any} argv
 * @param {boolean} interactive
 * @param {string} template
 * @returns {Promise<{envVars: {username: string, target: string, password?: string}, cancelled: boolean}>}
 */
export async function getEnvVars(argv, interactive, template) {
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

	let username = argv['cli-target-username'];
	let target = argv['cli-target'];
	let password = '';

	const prefix = gray('https://') + magenta('fabric.harper.fast') + gray('/') + ' Cluster ';

	if (interactive) {
		if (!username) {
			const usernameResult = await prompts.text({
				message: prefix + 'Username:',
				placeholder: 'YOUR_CLUSTER_USERNAME',
			});

			if (prompts.isCancel(usernameResult)) {
				return { envVars: {}, cancelled: true };
			}
			username = usernameResult;
		}

		const passwordResult = await prompts.password({
			message: prefix + 'Password:',
		});

		if (prompts.isCancel(passwordResult)) {
			return { envVars: {}, cancelled: true };
		}
		password = passwordResult;

		if (!target) {
			const targetResult = await prompts.text({
				message: prefix + 'URL:',
				placeholder: 'YOUR_CLUSTER_URL_HERE',
			});

			if (prompts.isCancel(targetResult)) {
				return { envVars: {}, cancelled: true };
			}
			target = targetResult;
		}
	} else {
		prompts.log.warn('Non-interactive mode: Please update your .env to add your CLI_TARGET_PASSWORD on your own.');
	}

	return {
		envVars: {
			username: username || 'YOUR_CLUSTER_USERNAME',
			target: target || 'YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE',
			password: password || 'YOUR_CLUSTER_PASSWORD',
		},
		cancelled: false,
	};
}
