import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlTemplateDir } from '../fs/crawlTemplateDir.js';
import { getWorkflowSubstitutions } from '../pkg/getWorkflowSubstitutions.js';

/**
 * Step 6: Create the project structure and files based on the collected information.
 *
 * @param {string} root - The root directory for the project.
 * @param {string} projectName - The name of the project.
 * @param {string} packageName - The name for the package.json.
 * @param {string} template - The template name to use.
 * @param {import('./getEnvVars.js').EnvVars} [envVars] - Environment variables to substitute.
 * @param {string} [pkgManager] - The package manager that invoked us (e.g. npm, pnpm, yarn, bun). Defaults to npm.
 * @param {string} [pkgManagerVersion] - That package manager's version, used to pin it in CI.
 */
export function scaffoldProject(root, projectName, packageName, template, envVars, pkgManager, pkgManagerVersion) {
	fs.mkdirSync(root, { recursive: true });
	prompts.log.step(`Scaffolding project in ${root}...`);

	const agent = pkgManager || 'npm';
	const substitutions = {
		'your-project-name-here': projectName || 'your-project-name-here',
		'your-package-name-here': packageName || 'your-package-name-here',
		'your-fabric.harper.fast-cluster-url-here': envVars?.target || 'your-fabric.harper.fast-cluster-url-here',
		// Substitution runs these keys in order as plain string replaces, so the longer
		// `your-package-manager-*-here` placeholders resolve before the bare one below and can
		// never have their prefix eaten by it.
		...getWorkflowSubstitutions(agent, pkgManagerVersion),
		'your-package-manager-here': agent,
		'\n\t"repository": "github:HarperFast/create-harper",': '',
	};

	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'..',
		'..',
		'..',
		`template-${template}`,
	);
	crawlTemplateDir(root, templateDir, substitutions);
}
