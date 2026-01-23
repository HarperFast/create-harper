#!/usr/bin/env node
import * as prompts from '@clack/prompts';
import mri from 'mri';
import { helpMessage } from './lib/constants/helpMessage.js';
import { formatTargetDir } from './lib/fs/formatTargetDir.js';
import { pkgFromUserAgent } from './lib/pkg/pkgFromUserAgent.js';
import { checkForUpdate } from './lib/steps/checkForUpdate.js';
import { getEnvVars } from './lib/steps/getEnvVars.js';
import { getExamples } from './lib/steps/getExamples.js';
import { getPackageName } from './lib/steps/getPackageName.js';
import { getProjectName } from './lib/steps/getProjectName.js';
import { getRunAppImmediately } from './lib/steps/getRunAppImmediately.js';
import { getTemplate } from './lib/steps/getTemplate.js';
import { handleExistingDir } from './lib/steps/handleExistingDir.js';
import { helpAgents } from './lib/steps/helpAgents.js';
import { scaffoldProject } from './lib/steps/scaffoldProject.js';
import { showOutro } from './lib/steps/showOutro.js';

init().catch((e) => {
	console.error(e);
});

async function init() {
	const argv = mri(process.argv.slice(2), {
		boolean: [
			'help',
			'immediate',
			'interactive',
			'overwrite',
			'version',
		],
		string: [
			'deploymentURL',
			'deploymentUsername',
			'template',
		],
		alias: {
			h: 'help',
			i: 'immediate',
			t: 'template',
			v: 'version',
		},
	});
	const argDeploymentURL = argv.deploymentURL;
	const argDeploymentUsername = argv.deploymentUsername;
	const argImmediate = argv.immediate;
	const argInteractive = argv.interactive;
	const argOverwrite = argv.overwrite;
	const argTargetDir = argv._[0] ? formatTargetDir(String(argv._[0])) : undefined;
	const argTemplate = argv.template;
	const help = argv.help;
	const version = argv.version;

	if (help) {
		console.log(helpMessage);
		return;
	}

	const currentVersion = await checkForUpdate();
	if (version) {
		console.log(`Current version: ${currentVersion}`);
		return;
	}

	const interactive = argInteractive ?? process.stdin.isTTY;

	// Detect AI agent environment for better agent experience (AX)
	await helpAgents(interactive);

	const cancel = () => prompts.cancel('Operation cancelled');

	// Get the project name and target directory
	const projectNameResult = await getProjectName(argTargetDir, interactive);
	if (projectNameResult.cancelled) { return cancel(); }
	const { projectName, targetDir } = projectNameResult;

	// Handle if the directory exists and isn't empty
	const handleExistingDirResult = await handleExistingDir(targetDir, argOverwrite, interactive);
	if (handleExistingDirResult.cancelled) { return cancel(); }

	// Get the package name
	const packageNameResult = await getPackageName(targetDir, interactive);
	if (packageNameResult.cancelled) { return cancel(); }
	const { packageName } = packageNameResult;

	// Choose a framework and variant
	const templateResult = await getTemplate(argTemplate, interactive);
	if (templateResult.cancelled) { return cancel(); }
	const { template } = templateResult;

	// Choose which examples to include
	const examplesResult = await getExamples(template, interactive);
	if (examplesResult.cancelled) { return cancel(); }
	const { excludedFiles } = examplesResult;

	// Get environment variables for .env file
	const envVarsResult = await getEnvVars(interactive, template, argDeploymentUsername, argDeploymentURL);
	if (envVarsResult.cancelled) { return cancel(); }
	const { envVars } = envVarsResult;

	// Should we do a package manager installation?
	const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
	const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
	const immediateResult = await getRunAppImmediately(argImmediate, interactive, pkgManager);
	if (immediateResult.cancelled) { return cancel(); }
	const { immediate } = immediateResult;

	// Write out the contents based on all prior steps.
	const root = scaffoldProject(targetDir, projectName, packageName, template, envVars, excludedFiles);

	// Log out the next steps.
	showOutro(root, pkgManager, immediate);
}
