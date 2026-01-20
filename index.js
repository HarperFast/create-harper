#!/usr/bin/env node
import * as prompts from '@clack/prompts';
import { determineAgent } from '@vercel/detect-agent';
import spawn from 'cross-spawn';
import mri from 'mri';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultTargetDir } from './lib/constants/defaultTargetDir.js';
import { FRAMEWORKS } from './lib/constants/frameworks.js';
import { helpMessage } from './lib/constants/helpMessage.js';
import { TEMPLATES } from './lib/constants/templates.js';
import { crawlTemplateDir } from './lib/fs/crawlTemplateDir.js';
import { emptyDir } from './lib/fs/emptyDir.js';
import { formatTargetDir } from './lib/fs/formatTargetDir.js';
import { isEmpty } from './lib/fs/isEmpty.js';
import { install } from './lib/install.js';
import { getFullCustomCommand } from './lib/pkg/getFullCustomCommand.js';
import { getInstallCommand } from './lib/pkg/getInstallCommand.js';
import { getRunCommand } from './lib/pkg/getRunCommand.js';
import { isValidPackageName } from './lib/pkg/isValidPackageName.js';
import { pkgFromUserAgent } from './lib/pkg/pkgFromUserAgent.js';
import { toValidPackageName } from './lib/pkg/toValidPackageName.js';
import { start } from './lib/start.js';

const argv = mri(process.argv.slice(2), {
	boolean: ['help', 'overwrite', 'immediate', 'interactive'],
	alias: { h: 'help', t: 'template', i: 'immediate' },
	string: ['template'],
});
const cwd = process.cwd();

init().catch((e) => {
	console.error(e);
});

async function init() {
	const argTargetDir = argv._[0]
		? formatTargetDir(String(argv._[0]))
		: undefined;
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

	const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
	const cancel = () => prompts.cancel('Operation cancelled');

	// 1. Get project name and target dir
	let targetDir = argTargetDir;
	let projectName = targetDir;
	if (!targetDir) {
		if (interactive) {
			projectName = await prompts.text({
				message: 'Project name:',
				defaultValue: defaultTargetDir,
				placeholder: defaultTargetDir,
				validate: (value) => {
					return !value || formatTargetDir(value).length > 0
						? undefined
						: 'Invalid project name';
				},
			});
			if (prompts.isCancel(projectName)) { return cancel(); }
			targetDir = formatTargetDir(projectName);
		} else {
			targetDir = defaultTargetDir;
		}
	}

	// 2. Handle directory if exist and not empty
	if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
		let overwrite = argOverwrite
			? 'yes'
			: undefined;
		if (!overwrite) {
			if (interactive) {
				const res = await prompts.select({
					message: (targetDir === '.'
						? 'Current directory'
						: `Target directory "${targetDir}"`)
						+ ` is not empty. Please choose how to proceed:`,
					options: [
						{
							label: 'Cancel operation',
							value: 'no',
						},
						{
							label: 'Remove existing files and continue',
							value: 'yes',
						},
						{
							label: 'Ignore files and continue',
							value: 'ignore',
						},
					],
				});
				if (prompts.isCancel(res)) { return cancel(); }
				overwrite = res;
			} else {
				overwrite = 'no';
			}
		}

		switch (overwrite) {
			case 'yes':
				emptyDir(targetDir);
				break;
			case 'no':
				cancel();
				return;
		}
	}

	// 3. Get package name
	let packageName = path.basename(path.resolve(targetDir));
	if (!isValidPackageName(packageName)) {
		if (interactive) {
			const packageNameResult = await prompts.text({
				message: 'Package name:',
				defaultValue: toValidPackageName(packageName),
				placeholder: toValidPackageName(packageName),
				validate(dir) {
					if (dir && !isValidPackageName(dir)) {
						return 'Invalid package.json name';
					}
				},
			});
			if (prompts.isCancel(packageNameResult)) { return cancel(); }
			packageName = packageNameResult;
		} else {
			packageName = toValidPackageName(packageName);
		}
	}

	// 4. Choose a framework and variant
	let template = argTemplate;
	let hasInvalidArgTemplate = false;
	if (argTemplate && !TEMPLATES.includes(argTemplate)) {
		template = undefined;
		hasInvalidArgTemplate = true;
	}
	if (!template) {
		if (interactive) {
			const framework = await prompts.select({
				message: hasInvalidArgTemplate
					? `"${argTemplate}" isn't a valid template. Please choose from below: `
					: 'Select a framework:',
				options: FRAMEWORKS
					.filter(framework => !framework.hidden)
					.map((framework) => {
						const frameworkColor = framework.color;
						return {
							label: frameworkColor(framework.display || framework.name),
							value: framework,
						};
					}),
			});
			if (prompts.isCancel(framework)) { return cancel(); }

			const variant = framework.variants.length === 1
				? framework.variants[0].name
				: await prompts.select({
					message: 'Select a variant:',
					options: framework.variants.map((variant) => {
						const variantColor = variant.color;
						const command = variant.customCommand
							? getFullCustomCommand(variant.customCommand, pkgInfo).replace(
								/ TARGET_DIR$/,
								'',
							)
							: undefined;
						return {
							label: variantColor(variant.display || variant.name),
							value: variant.name,
							hint: command,
						};
					}),
				});
			if (prompts.isCancel(variant)) { return cancel(); }

			template = variant;
		} else {
			template = 'vanilla-ts';
		}
	}

	const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

	const root = path.join(cwd, targetDir);

	const { customCommand } = FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ?? {};

	if (customCommand) {
		const fullCustomCommand = getFullCustomCommand(customCommand, pkgInfo);

		const [command, ...args] = fullCustomCommand.split(' ');
		// we replace TARGET_DIR here because targetDir may include a space
		const replacedArgs = args.map((arg) => arg.replace('TARGET_DIR', () => targetDir));
		const { status } = spawn.sync(command, replacedArgs, {
			stdio: 'inherit',
		});
		process.exit(status ?? 0);
	}

	// 5. Ask about immediate install and package manager
	let immediate = argImmediate;
	if (immediate === undefined) {
		if (interactive) {
			const immediateResult = await prompts.confirm({
				message: `Install with ${pkgManager} and start now?`,
			});
			if (prompts.isCancel(immediateResult)) { return cancel(); }
			immediate = immediateResult;
		} else {
			immediate = false;
		}
	}

	// Only create a directory for built-in templates, not for customCommand
	fs.mkdirSync(root, { recursive: true });
	prompts.log.step(`Scaffolding project in ${root}...`);

	const context = {
		projectName,
		packageName,
	};

	const templateSharedDir = path.resolve(fileURLToPath(import.meta.url), '..', `template-shared`);
	crawlTemplateDir(root, templateSharedDir, context);

	const templateDir = path.resolve(fileURLToPath(import.meta.url), '..', `template-${template}`);
	crawlTemplateDir(root, templateDir, context);

	if (immediate) {
		install(root, pkgManager);
		start(root, pkgManager);
	} else {
		let doneMessage = '';
		const cdProjectName = path.relative(cwd, root);
		doneMessage += `Done. Now run:\n`;
		if (root !== cwd) {
			doneMessage += `\n  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`;
		}
		doneMessage += `\n  ${getInstallCommand(pkgManager).join(' ')}`;
		doneMessage += `\n  ${getRunCommand(pkgManager, 'dev').join(' ')}`;
		prompts.outro(doneMessage);
	}
}
