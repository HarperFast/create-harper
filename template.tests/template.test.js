import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { templateNames } from '../lib/constants/templates.js';

const root = path.resolve(import.meta.dirname, '..');
const cliPath = path.resolve(root, 'index.js');
const tempDir = path.resolve(root, '.temp-integration-tests');

// Templates whose deploy builds before it uploads. Kept as an explicit list so a new template
// can't silently skip a build it needs: it fails the assertions below until it's added here.
const BUILD_BEFORE_DEPLOY_TEMPLATES = new Set(['nextjs', 'nextjs-ts']);

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

	for (const template of templateNames) {
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
					CREATE_HARPER_SKIP_UPDATE: '1',
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

			const templateDir = path.resolve(root, `template-${template}`);
			if (fs.existsSync(path.join(templateDir, '_env'))) {
				expect(fs.existsSync(path.join(targetDir, '.env'))).toBe(true);
				// Credentials come from `harper login` (local) or GitHub Actions secrets (CI); the
				// scaffolded .env only selects the target cluster.
				const envContent = fs.readFileSync(path.join(targetDir, '.env'), 'utf-8');
				expect(envContent).toContain('CLI_TARGET');
				expect(envContent).not.toContain('CLI_TARGET_USERNAME');
				expect(envContent).not.toContain('CLI_TARGET_PASSWORD');
			}

			if (fs.existsSync(path.join(templateDir, '_env.example'))) {
				expect(fs.existsSync(path.join(targetDir, '.env.example'))).toBe(true);
			}

			// The deploy workflow must live under `.github/workflows/` (plural — GitHub only runs
			// workflows there; the singular `workflow/` these templates used to ship never triggered).
			expect(fs.existsSync(path.join(targetDir, '.github', 'workflows', 'deploy.yaml'))).toBe(true);
			// Deploy and its setup are driven by the native harper CLI, never a per-project script.
			expect(fs.existsSync(path.join(targetDir, 'scripts'))).toBe(false);
			expect(pkgJson.scripts['deploy:setup-ci']).toBe(
				`harper deploy setup=true provider=github-actions project=${projectName}`,
			);

			if (BUILD_BEFORE_DEPLOY_TEMPLATES.has(template)) {
				// Building on the cluster fails for Next.js (HarperFast/nextjs#57, #58), so the deploy
				// uploads a `.next` built here.
				expect(pkgJson.scripts.deploy).toBe(`next build && harper deploy project=${projectName} restart=rolling`);
				expect(pkgJson.scripts['deploy:setup']).toBeUndefined();
			} else {
				expect(pkgJson.scripts.deploy).toBe(`harper deploy project=${projectName} restart=rolling`);
				expect(pkgJson.scripts['deploy:setup']).toBe(`harper deploy setup=true project=${projectName}`);
			}
		});
	}
});
