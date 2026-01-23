import fs from 'node:fs';

/**
 * Checks if a directory is empty or only contains dot files/folders.
 *
 * @param {string} path - The path to the directory to check.
 * @returns {boolean} - True if the directory is considered empty, false otherwise.
 */
export function isEmpty(path) {
	const files = fs.readdirSync(path);
	const foundNonDitFile = files.some(f => !f.startsWith('.'));
	return files.length === 0 || !foundNonDitFile;
}
