import fs from 'node:fs';
import path from 'node:path';

export function emptyDir(dir) {
	if (!fs.existsSync(dir)) {
		return;
	}
	for (const file of fs.readdirSync(dir)) {
		if (file === '.git') {
			continue;
		}
		fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
	}
}
