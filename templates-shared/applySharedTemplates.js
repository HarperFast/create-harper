#!/usr/bin/env node

import path from 'node:path';
import { copyDir } from '../lib/fs/copyDir.js';

(async function() {
	const copiesToMake = {
		'all': [
			'template-early-hints',
			'template-react',
			'template-react-ts',
			'template-react-ssr',
			'template-react-ts-ssr',
			'template-vanilla',
			'template-vanilla-ts',
			'template-vue',
			'template-vue-ts',
			'template-vue-ssr',
			'template-vue-ts-ssr',
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
