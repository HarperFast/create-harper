#!/usr/bin/env node

import path from 'node:path';
import colors from 'picocolors';
import { copyDir } from '../lib/fs/copyDir.js';

const {
	cyan,
	green,
} = colors;

(async function() {
	const copiesToMake = {
		'all': [
			'template-react',
			'template-react-ts',
			'template-studio',
			'template-studio-ts',
			'template-vanilla',
			'template-vanilla-ts',
		],
		'js': [
			'template-react',
			'template-studio',
			'template-vanilla',
		],
		'ts': [
			'template-react-ts',
			'template-studio-ts',
			'template-vanilla-ts',
		],
	};
	// await copyDir();
	for (const key in copiesToMake) {
		const fromShared = path.resolve(import.meta.dirname, key);
		for (const targetTemplate of copiesToMake[key]) {
			const toTemplate = path.resolve(import.meta.dirname, '..', targetTemplate);
			copyDir(fromShared, toTemplate);
			console.log(`Copied ${cyan(fromShared)} to ${green(toTemplate)}`);
		}
	}
})();
