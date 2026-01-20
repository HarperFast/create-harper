import fs from 'node:fs';

export function editFile(file, callback) {
	const content = fs.readFileSync(file, 'utf-8');
	fs.writeFileSync(file, callback(content), 'utf-8');
}
