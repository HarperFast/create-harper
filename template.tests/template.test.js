import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { templateNames } from '../lib/constants/templates.js';

const root = path.resolve(import.meta.dirname, '..');
const cliPath = path.resolve(root, 'index.js');
const tempDir = path.resolve(root, '.temp-integration-tests');

// Templates that still deploy by payload rather than by reference. Kept as an explicit list so
// adding a template can't silently opt out of deploy-by-reference — a new one fails the by-ref
// assertions below until it's either wired up or added here with a reason.
const PAYLOAD_DEPLOY_TEMPLATES = new Set(['nextjs', 'nextjs-ts']);

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
			// Deploy is driven by the native harper CLI, never a per-project script.
			expect(fs.existsSync(path.join(targetDir, 'scripts', 'deploy.mjs'))).toBe(false);

			if (PAYLOAD_DEPLOY_TEMPLATES.has(template)) {
				// Next.js deploys by payload: `.next` is gitignored, so a git reference carries no
				// build output, and building on the cluster fails (HarperFast/nextjs#57, #58).
				expect(pkgJson.scripts.deploy).toBe('next build && harper deploy_component . restart=true replicated=true');
				expect(pkgJson.scripts['deploy:setup']).toBeUndefined();
			} else {
				expect(pkgJson.scripts.deploy).toBe(
					'harper deploy by_ref=true credential=true restart=true replicated=true',
				);
				expect(pkgJson.scripts['deploy:setup']).toBe('harper deploy setup=true');
			}
		});
	}
});
