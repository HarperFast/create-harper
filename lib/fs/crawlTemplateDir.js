import fs from 'node:fs';
import path from 'node:path';
import { renameFiles } from '../constants/renameFiles.js';
import { applyAndWriteTemplateFile } from './applyAndWriteTemplateFile.js';

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
			applyAndWriteTemplateFile(targetPath, templatePath, substitutions);
		}
	}
}
