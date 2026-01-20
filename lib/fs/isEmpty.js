import fs from 'node:fs';

export function isEmpty(path) {
	const files = fs.readdirSync(path);
	return files.length === 0 || (files.length === 1 && files[0] === '.git');
}
