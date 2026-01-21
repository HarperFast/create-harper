import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TEMPLATES } from '../lib/constants/templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const cliPath = path.resolve(root, 'index.js');
const tempDir = path.resolve(root, '.temp-integration-tests');

describe('Integration tests', () => {
	beforeAll(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
		fs.mkdirSync(tempDir, { recursive: true });
	});

	afterAll(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	for (const template of TEMPLATES) {
		test(`generates ${template} template`, () => {
			const projectName = `test-${template}`;
			const targetDir = path.resolve(tempDir, projectName);

			const result = spawnSync('node', [
				cliPath,
				projectName,
				'--template',
				template,
				'--no-interactive',
				'--overwrite',
			], {
				cwd: tempDir,
				env: {
					...process.env,
					_HARPER_TEST_CLI: '1',
					// Ensure we use a predictable agent for the test if possible
					npm_config_user_agent: 'npm/10.0.0 node/v20.0.0 darwin arm64',
				},
				encoding: 'utf-8',
			});

			if (result.status !== 0) {
				console.error(result.stderr);
				console.log(result.stdout);
			}

			expect(result.status).toBe(0);
			expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);

			const pkgJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
			expect(pkgJson.name).toBe(projectName);

			if (fs.existsSync(path.join(targetDir, 'README.md'))) {
				const readme = fs.readFileSync(path.join(targetDir, 'README.md'), 'utf-8');
				expect(readme).toContain(`# ${projectName}`);
			}

			// Check for renamed files
			expect(fs.existsSync(path.join(targetDir, '.gitignore'))).toBe(true);
			expect(fs.existsSync(path.join(targetDir, '.aiignore'))).toBe(true);
		});
	}
});
