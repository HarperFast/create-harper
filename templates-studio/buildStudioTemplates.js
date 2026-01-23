#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { templates } from '../lib/constants/templates.js';
import { copyDir } from '../lib/fs/copyDir.js';
import { emptyDir } from '../lib/fs/emptyDir.js';
import { renameFile } from '../lib/fs/renameFile.js';
import { writeFile } from '../lib/fs/writeFile.js';
import { getOwnVersion } from '../lib/pkg/packageInformation.js';

(async function() {
	for (const templateName of templates) {
		const targetTemplate = 'template-' + templateName;
		const fromTemplate = path.resolve(import.meta.dirname, '..', targetTemplate);
		const toTemplate = path.resolve(import.meta.dirname, targetTemplate);
		emptyDir(toTemplate);
		copyDir(
			fromTemplate,
			toTemplate,
			(srcFile) => !srcFile.includes('_env'),
			(sourceContent, targetPath) => {
				if (targetPath.endsWith('package.json')) {
					return sourceContent
						.replace(/your-package-name-here/g, `@harperfast/${targetTemplate}-studio`)
						.replace(/"version": "0.0.0"/g, `"version": "${getOwnVersion()}"`)
						.replace(/"scripts":[\s\S]+?\t}/, '"scripts": {}');
				} else if (targetPath.endsWith('README.md')) {
					return sourceContent
						// Give a more accurate greeting.
						.replace(
							'Your new app is now ready for development!',
							'Your new app is now deployed and running on Harper Fabric!',
						)
						// Add a link to the New Table button when working on schemas.
						.replace(
							'### Define Your Schema',
							`### Define Your Schema

Tap [+ New Table](./schemas/examplePeople.graphql?ShowNewTableModal=true) when viewing a schema file, and you'll be guided through the available options.`,
						)
						.replace(/database schema/ig, '[database schema](./databases)')
						.replace(
							'### Use Your API',
							`### Use Your API

Head to the [APIs](./apis) tab to explore your endpoints and exercise them. You can click the "Authenticate" button to
see what different users will be able to access through your API.`,
						)
						// Remove a few sections
						.replace(/#+ Installation[\s\S]+?\n#/g, '#')
						.replace(/#+ Development[\s\S]+?\n#/g, '#')
						.replace(/#+ Deployment[\s\S]+?\n#/g, '#');
				}
				return sourceContent;
			},
		);

		if (fs.existsSync(path.resolve(fromTemplate, '_github'))) {
			emptyDir(path.resolve(toTemplate, '.github'));
			renameFile(path.resolve(toTemplate, '_github'), path.resolve(toTemplate, '.github'));
		}
		renameFile(path.resolve(toTemplate, '_gitignore'), path.resolve(toTemplate, '.gitignore'));
		renameFile(path.resolve(toTemplate, '_aiignore'), path.resolve(toTemplate, '.aiignore'));
		writeFile(path.resolve(toTemplate, '.npmignore'), '!.gitignore\n.npmignore\n');
	}
})();
