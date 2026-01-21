import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlTemplateDir } from '../fs/crawlTemplateDir.js';

/**
 * Step 6: Create the project structure and files based on the collected information.
 *
 * @param {string} targetDir - The target directory for the project.
 * @param {string} projectName - The name of the project.
 * @param {string} packageName - The name for the package.json.
 * @param {string} template - The template name to use.
 * @param {import('./getEnvVars.js').EnvVars} envVars - Environment variables to substitute.
 * @param {string[]} [excludedFiles] - A list of files to exclude from the template.
 * @returns {string} - The absolute path to the root of the scaffolded project.
 */
export function scaffoldProject(targetDir, projectName, packageName, template, envVars, excludedFiles = []) {
	const cwd = process.cwd();
	const root = path.join(cwd, targetDir);
	fs.mkdirSync(root, { recursive: true });
	prompts.log.step(`Scaffolding project in ${root}...`);

	const substitutions = {
		'your-project-name-here': projectName,
		'your-package-name-here': packageName,
		'your-cluster-username-here': envVars.username,
		'your-cluster-password-here': envVars.password,
		'your-fabric.harper.fast-cluster-url-here': envVars.target,
	};

	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'..',
		'..',
		'..',
		`template-${template}`,
	);
	crawlTemplateDir(root, templateDir, substitutions, excludedFiles);

	return root;
}
