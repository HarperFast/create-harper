#!/usr/bin/env node

import spawn from 'cross-spawn';
import fs from 'node:fs';
import path from 'node:path';
import { templates } from '../lib/constants/templates.js';

(async function() {
	for (const templateName of templates) {
		const targetTemplate = 'template-' + templateName;
		const toTemplate = path.resolve(import.meta.dirname, targetTemplate);
		if (!fs.existsSync(toTemplate)) {
			console.error('Please npm run templates:build-studio-templates before templates:publish-studio-templates');
			process.exit(1);
		}
		const { status } = spawn.sync('npm', ['publish', '--provenance'], {
			encoding: 'utf-8',
			cwd: toTemplate,
			stdio: 'inherit',
		});
		if (status != null && status > 0) {
			process.exit(status);
		}
	}
})();
