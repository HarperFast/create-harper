import fs from 'node:fs';
import colors from 'picocolors';

const {
	magenta,
} = colors;

/**
 * Removes a file.
 *
 * @param {string} targetPath - The name of the file or directory to remove.
 */
export function rmFile(targetPath) {
	console.log(' - ' + magenta(targetPath));
	fs.rmSync(targetPath);
}
