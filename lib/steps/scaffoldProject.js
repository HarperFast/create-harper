import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlTemplateDir } from '../fs/crawlTemplateDir.js';

/**
 * Step 6: Create the project structure and files based on the collected information.
 *
 * @param {string} root - The root directory for the project.
 * @param {string} projectName - The name of the project.
 * @param {string} packageName - The name for the package.json.
 * @param {string} template - The template name to use.
 * @param {import('./getEnvVars.js').EnvVars} [envVars] - Environment variables to substitute.
 * @param {string[]} [excludedFiles] - A list of files to exclude from the template.
 */
export function scaffoldProject(root, projectName, packageName, template, envVars, excludedFiles = []) {
	fs.mkdirSync(root, { recursive: true });
	prompts.log.step(`Scaffolding project in ${root}...`);

	const substitutions = {
		'your-project-name-here': projectName || 'your-project-name-here',
		'your-package-name-here': packageName || 'your-package-name-here',
		'your-cluster-username-here': envVars?.username || 'your-cluster-username-here',
		'your-cluster-password-here': envVars?.password || 'your-cluster-password-here',
		'your-fabric.harper.fast-cluster-url-here': envVars?.target || 'your-fabric.harper.fast-cluster-url-here',
	};

	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'..',
		'..',
		'..',
		`template-${template}`,
	);
	crawlTemplateDir(root, templateDir, substitutions, excludedFiles);
}
