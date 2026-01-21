import fs from 'node:fs';
import path from 'node:path';
import { renameFiles } from '../constants/renameFiles.js';
import { applyAndWriteTemplateFile } from './applyAndWriteTemplateFile.js';

export function crawlTemplateDir(root, dir, substitutions) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const targetPath = path.join(root, renameFiles[file] ?? file);
		const templatePath = path.join(dir, file);
		if (fs.lstatSync(templatePath).isDirectory()) {
			fs.mkdirSync(targetPath, { recursive: true });
			crawlTemplateDir(targetPath, templatePath, substitutions);
		} else {
			applyAndWriteTemplateFile(targetPath, templatePath, substitutions);
		}
	}
}
