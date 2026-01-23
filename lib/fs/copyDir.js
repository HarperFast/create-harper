import fs from 'node:fs';
import path from 'node:path';
import { copyFile } from './copyFile.js';

/**
 * Recursively copies a directory from source to destination.
 *
 * @param {string} srcDir - The source directory path.
 * @param {string} destDir - The destination directory path.
 * @param {(src: string, dest: string) => boolean} [filter] - An optional filter function that returns true if the file should be included.
 * @param {Record<string, string> | ((content: string, targetPath: string) => string)} [substitutions] - A mapping of strings to replace or a function that returns the updated content.
 */
export function copyDir(srcDir, destDir, filter, substitutions) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const file of fs.readdirSync(srcDir)) {
		const srcFile = path.resolve(srcDir, file);
		const destFile = path.resolve(destDir, file);
		if (filter === undefined || filter(srcFile, destFile)) {
			if (fs.lstatSync(srcFile).isDirectory()) {
				fs.mkdirSync(destFile, { recursive: true });
				copyDir(srcFile, destFile, substitutions);
			} else {
				copyFile(srcFile, destFile, substitutions);
			}
		}
	}
}
