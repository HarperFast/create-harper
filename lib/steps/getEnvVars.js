import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'picocolors';
import { defaultPassword, defaultTarget, defaultUsername } from '../constants/defaultEnv.js';

const {
	gray,
	magenta,
} = colors;

/**
 * @typedef {Object} EnvVars
 * @property {string} [username] - The HarperDB cluster username.
 * @property {string} [target] - The HarperDB cluster URL.
 * @property {string} [password] - The HarperDB cluster password.
 */

/**
 * Step 5: Get environment variables for the .env file, optionally prompting the user.
 *
 * @param {Record<string, any>} argv - The parsed CLI arguments.
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @param {string} template - The selected template name.
 * @returns {Promise<{envVars: EnvVars, cancelled: boolean}>} - The environment variables and cancellation status.
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
				message: prefix + 'Username (optional):',
				placeholder: defaultUsername,
			});

			if (prompts.isCancel(usernameResult)) {
				return { envVars: {}, cancelled: true };
			}
			username = usernameResult;
		}

		const passwordResult = username && await prompts.password({
			message: prefix + 'Password:',
		});

		if (prompts.isCancel(passwordResult)) {
			return { envVars: {}, cancelled: true };
		}
		password = passwordResult;

		if (!target && username) {
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

	if (target) {
		if (!target.startsWith('http://') && !target.startsWith('https://')) {
			target = 'https://' + target;
		}
		if (!target.endsWith('/')) {
			target = target + '/';
		}

		if (!process.env._HARPER_TEST_CLI && target !== defaultTarget) {
			try {
				const url = new URL(target);
				const base = `${url.protocol}//${url.hostname}:${(url.port || '9925')}`;

				const healthResponse = await fetch(`${base}/health`);
				if (healthResponse.ok) {
					if (
						username && username !== defaultUsername && password && password !== defaultPassword
					) {
						const authResponse = await fetch(`${base}/`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
							},
							body: JSON.stringify({
								operation: 'user_info',
							}),
						});

						if (authResponse.ok) {
							prompts.log.success('Successfully authenticated with your cluster!');
						} else {
							prompts.log.error(
								'Failed to authenticate with your cluster. Please check your credentials in the .env file.',
							);
						}
					}
				} else {
					prompts.log.error(
						'Could not reach your cluster health endpoint. Please check your credentials in the .env file.',
					);
				}
			} catch {
				prompts.log.error(
					'An error occurred while connecting to your cluster. Please check your credentials in the .env file.',
				);
			}
		}
	}

	return {
		envVars: {
			username: username || defaultUsername,
			target: target || defaultTarget,
			password: password || defaultPassword,
		},
		cancelled: false,
	};
}
