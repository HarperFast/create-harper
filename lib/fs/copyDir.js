import fs from 'node:fs';
import path from 'node:path';
import { copy } from './copy.js';

/**
 * Recursively copies a directory from source to destination.
 *
 * @param {string} srcDir - The source directory path.
 * @param {string} destDir - The destination directory path.
 */
export function copyDir(srcDir, destDir) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const file of fs.readdirSync(srcDir)) {
		const srcFile = path.resolve(srcDir, file);
		const destFile = path.resolve(destDir, file);
		copy(srcFile, destFile);
	}
}
