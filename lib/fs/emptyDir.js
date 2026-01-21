import fs from 'node:fs';
import path from 'node:path';

/**
 * Removes all files and directories within a directory, except for the .git directory.
 *
 * @param {string} dir - The path to the directory to empty.
 */
export function emptyDir(dir) {
	if (!fs.existsSync(dir)) {
		return;
	}
	for (const file of fs.readdirSync(dir)) {
		if (file === '.git') {
			continue;
		}
		fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
	}
}
