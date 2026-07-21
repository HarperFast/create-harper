#!/usr/bin/env node

import spawn from 'cross-spawn';
import fs from 'node:fs';
import path from 'node:path';
import { studioTemplateNames } from '../lib/constants/templates.js';

(async function() {
	let hitError = 0;
	for (const templateName of studioTemplateNames) {
		const targetTemplate = 'template-' + templateName;
		const toTemplate = path.resolve(import.meta.dirname, targetTemplate);
		if (!fs.existsSync(toTemplate)) {
			console.error('Please npm run templates:build-studio-templates before templates:publish-studio-templates');
			process.exit(1);
		}
		const { status } = spawn.sync('npm', ['publish', '--provenance', '--access', 'public'], {
			encoding: 'utf-8',
			cwd: toTemplate,
			stdio: 'inherit',
		});
		if (status != null && status > 0) {
			hitError = 0;
			console.error(`${templateName} failed to publish with status code ${status}`);
		}
	}
	if (hitError) {
		process.exit(hitError);
	}
})();
