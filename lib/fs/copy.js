import fs from 'node:fs';
import { copyDir } from './copyDir.js';

/**
 * Copies a file or directory from source to destination.
 *
 * @param {string} src - The source path.
 * @param {string} dest - The destination path.
 */
export function copy(src, dest) {
	const stat = fs.statSync(src);
	if (stat.isDirectory()) {
		copyDir(src, dest);
	} else {
		fs.copyFileSync(src, dest);
	}
}
