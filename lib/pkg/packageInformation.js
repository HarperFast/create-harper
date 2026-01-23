import fs from 'node:fs';

export function getOwnName() {
	const packageContents = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8');
	const packageJSON = packageContents ? JSON.parse(packageContents) : {};
	return packageJSON.name;
}

export function getOwnVersion() {
	const packageContents = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8');
	const packageJSON = packageContents ? JSON.parse(packageContents) : {};
	return packageJSON.version;
}
