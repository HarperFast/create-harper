#!/usr/bin/env node

import path from 'node:path';
import colors from 'picocolors';
import { copyDir } from '../lib/fs/copyDir.js';

const {
	cyan,
	green,
} = colors;

(async function() {
	const templatesToCopy = [
		'template-react',
		'template-react-ts',
		'template-vanilla',
		'template-vanilla-ts',
	];
	for (const targetTemplate of templatesToCopy) {
		const fromTemplate = path.resolve(import.meta.dirname, '..', targetTemplate);
		const toTemplate = path.resolve(import.meta.dirname, targetTemplate);
		copyDir(
			fromTemplate,
			toTemplate,
			(srcFile) => !srcFile.includes('_env'),
			(sourceContent, sourcePath, targetPath) => {
				if (sourcePath.endsWith('package.json')) {
					return sourceContent.replace(/"scripts":[\s\S]+?\t}/, '"scripts": {}');
				} else if (sourcePath.endsWith('README.md')) {
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

Tap [+ New Table](./schemas/exampleTable.graphql?ShowNewTableModal=true) when viewing a schema file, and you'll be guided through the available options.`,
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
	}
})();
