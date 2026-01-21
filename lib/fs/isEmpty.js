import fs from 'node:fs';

/**
 * Checks if a directory is empty or only contains a .git directory.
 *
 * @param {string} path - The path to the directory to check.
 * @returns {boolean} - True if the directory is considered empty, false otherwise.
 */
export function isEmpty(path) {
	const files = fs.readdirSync(path);
	return files.length === 0 || (files.length === 1 && files[0] === '.git');
}
