#!/usr/bin/env node

import path from 'node:path';
import { copyDir } from '../lib/fs/copyDir.js';

(async function() {
	const copiesToMake = {
		'all': [
			'template-react',
			'template-react-ts',
			'template-vanilla',
			'template-vanilla-ts',
		],
		'js': [
			'template-react',
			'template-vanilla',
		],
		'ts': [
			'template-react-ts',
			'template-vanilla-ts',
		],
	};
	for (const key in copiesToMake) {
		const fromShared = path.resolve(import.meta.dirname, key);
		for (const targetTemplate of copiesToMake[key]) {
			const toTemplate = path.resolve(import.meta.dirname, '..', targetTemplate);
			copyDir(fromShared, toTemplate);
		}
	}
})();
