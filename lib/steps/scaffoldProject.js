import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlTemplateDir } from '../fs/crawlTemplateDir.js';

/**
 * Step 6: Write out the contents based on all prior steps.
 * @param {string} targetDir
 * @param {string} projectName
 * @param {string} packageName
 * @param {string} template
 * @returns {string} The root directory of the project
 */
export function scaffoldProject(targetDir, projectName, packageName, template) {
	const cwd = process.cwd();
	const root = path.join(cwd, targetDir);
	fs.mkdirSync(root, { recursive: true });
	prompts.log.step(`Scaffolding project in ${root}...`);

	const substitutions = {
		'your-project-name-here': projectName,
		'your-package-name-here': packageName,
	};

	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'..',
		'..',
		'..',
		`template-${template}`,
	);
	crawlTemplateDir(root, templateDir, substitutions);

	return root;
}
