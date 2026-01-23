import fs from 'node:fs';
import colors from 'picocolors';

const {
	gray,
	magenta,
} = colors;

/**
 * Applies string substitutions and writes the result to a target path.
 *
 * @param {string} sourcePath - The original name of the file or directory.
 * @param {string} targetPath - The new name of the file or directory.
 */
export function renameFile(sourcePath, targetPath) {
	console.log(' . ' + magenta(targetPath) + gray(' from ' + sourcePath));
	fs.renameSync(sourcePath, targetPath);
}
