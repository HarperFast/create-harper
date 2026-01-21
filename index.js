#!/usr/bin/env node
import * as prompts from '@clack/prompts';
import { determineAgent } from '@vercel/detect-agent';
import mri from 'mri';
import { helpMessage } from './lib/constants/helpMessage.js';
import { formatTargetDir } from './lib/fs/formatTargetDir.js';
import { pkgFromUserAgent } from './lib/pkg/pkgFromUserAgent.js';
import { getEnvVars } from './lib/steps/getEnvVars.js';
import { getImmediate } from './lib/steps/getImmediate.js';
import { getPackageName } from './lib/steps/getPackageName.js';
import { getProjectName } from './lib/steps/getProjectName.js';
import { getTemplate } from './lib/steps/getTemplate.js';
import { handleExistingDir } from './lib/steps/handleExistingDir.js';
import { scaffoldProject } from './lib/steps/scaffoldProject.js';
import { showOutro } from './lib/steps/showOutro.js';

const argv = mri(process.argv.slice(2), {
	boolean: ['help', 'overwrite', 'immediate', 'interactive'],
	alias: { h: 'help', t: 'template', i: 'immediate' },
	string: ['template', 'cli-target-username', 'cli-target'],
});

init().catch((e) => {
	console.error(e);
});

async function init() {
	const argTargetDir = argv._[0] ? formatTargetDir(String(argv._[0])) : undefined;
	const argTemplate = argv.template;
	const argOverwrite = argv.overwrite;
	const argImmediate = argv.immediate;
	const argInteractive = argv.interactive;

	const help = argv.help;
	if (help) {
		console.log(helpMessage);
		return;
	}

	const interactive = argInteractive ?? process.stdin.isTTY;

	// Detect AI agent environment for better agent experience (AX)
	const { isAgent } = await determineAgent();
	if (isAgent && interactive) {
		console.log(
			'\nTo create in one go, run: create-harper <DIRECTORY> --no-interactive --template <TEMPLATE>\n',
		);
	}

	const cancel = () => prompts.cancel('Operation cancelled');

	// 1. Get the project name and target directory
	const projectNameResult = await getProjectName(argTargetDir, interactive);
	if (projectNameResult.cancelled) { return cancel(); }
	const { projectName, targetDir } = projectNameResult;

	// 2. Handle if the directory exists and isn't empty
	const handleExistingDirResult = await handleExistingDir(targetDir, argOverwrite, interactive);
	if (handleExistingDirResult.cancelled) { return cancel(); }

	// 3. Get the package name
	const packageNameResult = await getPackageName(targetDir, interactive);
	if (packageNameResult.cancelled) { return cancel(); }
	const { packageName } = packageNameResult;

	// 4. Choose a framework and variant
	const templateResult = await getTemplate(argTemplate, interactive);
	if (templateResult.cancelled) { return cancel(); }
	const { template } = templateResult;

	// 5. Should we do a package manager installation?
	const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
	const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
	const immediateResult = await getImmediate(argImmediate, interactive, pkgManager);
	if (immediateResult.cancelled) { return cancel(); }
	const { immediate } = immediateResult;

	// 6. Get environment variables for .env file
	const envVarsResult = await getEnvVars(argv, interactive, template);
	if (envVarsResult.cancelled) { return cancel(); }
	const { envVars } = envVarsResult;

	// 7. Write out the contents based on all prior steps.
	const root = scaffoldProject(targetDir, projectName, packageName, template, envVars);

	// 8. Log out the next steps.
	showOutro(root, pkgManager, immediate);
}
