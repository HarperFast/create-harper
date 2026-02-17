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
						.replace(
							'Your new app is now ready for development!',
							'Your new app is now deployed and running on Harper Fabric!',
						)
						.replace(
							'1. Create a new yourTableName.graphql file in the [schemas](./schemas) directory.',
							'1. Create a new [yourTableName.graphql](./schemas?ShowAddDirectoryOrFileModalType=file) file in the [schemas](./schemas) directory.',
						)
						.replace(
							'2. Craft your schema by hand.',
							'2. Craft your schema by hand or tap "+ New Table" in the action bar for a bit of guidance.',
						)
						.replace(
							/3\. Save your changes./ig,
							'3. Save your changes.\n4. Tap "Restart Cluster" and your changes will be live!',
						)
						.replace(
							/1\. Create a new greeting\.([tj])s file in the \[resources]\(\.\/resources\) directory./,
							'1. Create a new [greeting.$1s](./resources?ShowAddDirectoryOrFileModalType=file) file in the [resources](./resources) directory.',
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
		renameFile(path.resolve(toTemplate, '_nvmrc'), path.resolve(toTemplate, '.nvmrc'));
		renameFile(path.resolve(toTemplate, '_gitignore'), path.resolve(toTemplate, '.gitignore'));
		renameFile(path.resolve(toTemplate, '_aiignore'), path.resolve(toTemplate, '.aiignore'));
		writeFile(path.resolve(toTemplate, '.npmignore'), '!.gitignore\n.npmignore\n');
	}
})();
