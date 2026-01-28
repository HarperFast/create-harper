import mri from 'mri';
import { formatTargetDir } from '../fs/formatTargetDir.js';

export function parseArgv(rawArgv) {
	const argv = mri(rawArgv, {
		boolean: [
			'help',
			'immediate',
			'interactive',
			'overwrite',
			'skipInstall',
			'version',
		],
		string: [
			'deploymentURL',
			'deploymentUsername',
			'template',
		],
		alias: {
			c: 'deploymentURL',
			'deployment-url': 'deploymentURL',
			'deployment-username': 'deploymentUsername',
			h: 'help',
			i: 'immediate',
			o: 'overwrite',
			s: 'skipInstall',
			'skip-install': 'skipInstall',
			t: 'template',
			u: 'deploymentUsername',
			v: 'version',
		},
	});

	const positionalArgs = [];
	for (let i = 0; i < argv._.length; i++) {
		const arg = argv._[i];
		if (arg === 'help') {
			argv.help = true;
		} else if (arg === 'version' || arg === 'v') {
			argv.version = true;
		} else if (arg === 'template' || arg === 't') {
			if (argv._[i + 1]) {
				argv.template = argv._[i + 1];
				i++;
			}
		} else {
			positionalArgs.push(arg);
		}
	}

	return {
		deploymentURL: argv.deploymentURL,
		deploymentUsername: argv.deploymentUsername,
		help: argv.help,
		immediate: argv.immediate,
		interactive: argv.interactive ?? process.stdin.isTTY,
		overwrite: argv.overwrite,
		skipInstall: argv.skipInstall,
		targetDir: positionalArgs[0] ? formatTargetDir(String(positionalArgs[0])) : undefined,
		template: argv.template,
		version: argv.version,
	};
}
