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
	// template-early-hints is a legacy `harperdb` EdgeWorker example (not published via
	// `npm create harper`), so it is intentionally excluded from the deploy-by-reference
	// migration — it must not receive the `_github` deploy workflow that targets the modern
	// `harper` CLI. It still gets every other shared file.
	const excludeGithubForEarlyHints = (src) => !src.split(path.sep).includes('_github');

	for (const key in copiesToMake) {
		const fromShared = path.resolve(import.meta.dirname, key);
		for (const targetTemplate of copiesToMake[key]) {
			const toTemplate = path.resolve(import.meta.dirname, '..', targetTemplate);
			const filter = targetTemplate === 'template-early-hints' ? excludeGithubForEarlyHints : undefined;
			copyDir(fromShared, toTemplate, filter);
		}
	}
})();
