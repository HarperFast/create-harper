import fs from 'node:fs';
import path from 'node:path';
import { renameFiles } from '../constants/renameFiles.js';
import { copyFile } from './copyFile.js';

/**
 * Recursively crawls a template directory and copies files to the target root, applying substitutions and respecting exclusions.
 *
 * @param {string} root - The current target directory.
 * @param {string} dir - The current source directory in the template.
 * @param {Record<string, string> | ((content: string) => string)} substitutions - A mapping of strings to replace or a function that returns the updated content.
 * @param {string[]} [excludedFiles] - A list of relative paths to exclude from copying.
 * @param {string} [templateRootDir] - The absolute path to the root of the template directory (internal).
 */
export function crawlTemplateDir(root, dir, substitutions, excludedFiles = [], templateRootDir = dir) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const templatePath = path.join(dir, file);
		const relativePath = path.relative(templateRootDir, templatePath).split(path.sep).join('/');

		if (excludedFiles.includes(relativePath)) {
			continue;
		}

		const targetPath = path.join(root, renameFiles[file] ?? file);
		if (fs.lstatSync(templatePath).isDirectory()) {
			fs.mkdirSync(targetPath, { recursive: true });
			crawlTemplateDir(targetPath, templatePath, substitutions, excludedFiles, templateRootDir);
		} else {
			copyFile(templatePath, targetPath, substitutions);
		}
	}
}
