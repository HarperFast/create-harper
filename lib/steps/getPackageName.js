import * as prompts from '@clack/prompts';
import path from 'node:path';
import { isValidPackageName } from '../pkg/isValidPackageName.js';
import { toValidPackageName } from '../pkg/toValidPackageName.js';

/**
 * Step 3: Get package name
 * @param {string} targetDir
 * @param {boolean} interactive
 * @returns {Promise<{packageName: string, cancelled: boolean}>}
 */
export async function getPackageName(targetDir, interactive) {
	let packageName = path.basename(path.resolve(targetDir));

	if (!isValidPackageName(packageName)) {
		if (interactive) {
			const packageNameResult = await prompts.text({
				message: 'Package name:',
				defaultValue: toValidPackageName(packageName),
				placeholder: toValidPackageName(packageName),
				validate(dir) {
					if (dir && !isValidPackageName(dir)) {
						return 'Invalid package.json name';
					}
				},
			});

			if (prompts.isCancel(packageNameResult)) {
				return { packageName: '', cancelled: true };
			}
			packageName = packageNameResult;
		} else {
			packageName = toValidPackageName(packageName);
		}
	}

	return { packageName, cancelled: false };
}
