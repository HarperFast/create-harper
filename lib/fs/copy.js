import fs from 'node:fs';
import { copyDir } from './copyDir.js';

export function copy(src, dest) {
	const stat = fs.statSync(src);
	if (stat.isDirectory()) {
		copyDir(src, dest);
	} else {
		fs.copyFileSync(src, dest);
	}
}
