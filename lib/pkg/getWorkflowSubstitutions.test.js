import { describe, expect, test } from 'vitest';
import { getWorkflowSubstitutions } from './getWorkflowSubstitutions.js';

const SETUP_STEP = '# your-package-manager-setup-step-here';
const NODE_CACHE = '# your-package-manager-node-cache-here';
const INSTALL = 'your-package-manager-install-here';
const RUN = 'your-package-manager-run-here';

describe(getWorkflowSubstitutions, () => {
	test('substitutes every placeholder the scaffolded workflows carry', () => {
		expect(Object.keys(getWorkflowSubstitutions('npm', '10.9.0'))).toEqual([
			SETUP_STEP,
			NODE_CACHE,
			INSTALL,
			RUN,
		]);
	});

	describe('npm', () => {
		test('needs no setup step, and caches and installs through npm', () => {
			const substitutions = getWorkflowSubstitutions('npm', '10.9.0');

			expect(substitutions[SETUP_STEP]).toBe('# npm ships with Node.js, so it needs no setup step.');
			expect(substitutions[NODE_CACHE]).toBe("cache: 'npm'");
			expect(substitutions[INSTALL]).toBe('npm ci');
			expect(substitutions[RUN]).toBe('npm run');
		});
	});

	describe('pnpm', () => {
		test('sets pnpm up at the detected version, SHA-pinning the action', () => {
			const substitutions = getWorkflowSubstitutions('pnpm', '11.17.0');

			// The step is substituted into a comment that already sits at the workflow's step
			// indent, so the first line is bare and the rest carry their indentation.
			expect(substitutions[SETUP_STEP]).toBe(
				`- name: Set up pnpm
        # Pinned to the pnpm that wrote this project's lockfile. The action is SHA-pinned, but a
        # floating \`version:\` would still let it self-install an unvetted pnpm at run time.
        uses: pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271 # v6.0.9
        with:
          version: 11.17.0`,
			);
			expect(substitutions[NODE_CACHE]).toBe("cache: 'pnpm'");
			expect(substitutions[INSTALL]).toBe('pnpm install --frozen-lockfile');
			expect(substitutions[RUN]).toBe('pnpm run');
		});

		test('falls back to the latest pnpm when the user agent carried no version', () => {
			expect(getWorkflowSubstitutions('pnpm')[SETUP_STEP]).toContain('version: latest');
		});
	});

	describe('yarn', () => {
		test("needs no setup step, and uses Yarn 1's lockfile flag", () => {
			const substitutions = getWorkflowSubstitutions('yarn', '1.22.22');

			expect(substitutions[SETUP_STEP]).toContain("Yarn is preinstalled on GitHub's Ubuntu runners");
			expect(substitutions[NODE_CACHE]).toBe("cache: 'yarn'");
			expect(substitutions[INSTALL]).toBe('yarn install --frozen-lockfile');
			expect(substitutions[RUN]).toBe('yarn run');
		});

		test('uses --immutable on Yarn 2+, which dropped --frozen-lockfile', () => {
			expect(getWorkflowSubstitutions('yarn', '2.4.3')[INSTALL]).toBe('yarn install --immutable');
			expect(getWorkflowSubstitutions('yarn', '4.9.1')[INSTALL]).toBe('yarn install --immutable');
		});

		test('assumes Yarn 1 when the user agent carried no usable version', () => {
			expect(getWorkflowSubstitutions('yarn')[INSTALL]).toBe('yarn install --frozen-lockfile');
			expect(getWorkflowSubstitutions('yarn', 'stable')[INSTALL]).toBe('yarn install --frozen-lockfile');
		});
	});

	describe('bun', () => {
		test('sets Bun up at the detected version and leaves caching to setup-bun', () => {
			const substitutions = getWorkflowSubstitutions('bun', '1.2.19');

			expect(substitutions[SETUP_STEP]).toBe(
				`- name: Set up Bun
        # Pinned to the Bun that wrote this project's lockfile.
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with:
          bun-version: 1.2.19`,
			);
			// setup-node rejects any cache value other than npm, Yarn or pnpm, so this has to be a
			// comment rather than an input.
			expect(substitutions[NODE_CACHE]).toMatch(/^#/);
			expect(substitutions[NODE_CACHE]).toContain('oven-sh/setup-bun');
			expect(substitutions[INSTALL]).toBe('bun install --frozen-lockfile');
			expect(substitutions[RUN]).toBe('bun run');
		});
	});

	describe('deno', () => {
		test('sets Deno up at the detected version and runs scripts as tasks', () => {
			const substitutions = getWorkflowSubstitutions('deno', '2.5.0');

			expect(substitutions[SETUP_STEP]).toBe(
				`- name: Set up Deno
        # Pinned to the Deno that wrote this project's lockfile.
        uses: denoland/setup-deno@22d081ff2d3a40755e97629de92e3bcbfa7cf2ed # v2.0.5
        with:
          deno-version: 2.5.0`,
			);
			expect(substitutions[NODE_CACHE]).toMatch(/^#/);
			expect(substitutions[NODE_CACHE]).toContain('denoland/setup-deno');
			expect(substitutions[INSTALL]).toBe('deno install --frozen');
			expect(substitutions[RUN]).toBe('deno task');
		});
	});

	test('falls back to npm for an agent with no CI story, so the job fails loudly', () => {
		const substitutions = getWorkflowSubstitutions('unknown', '1.0.0');

		expect(substitutions[NODE_CACHE]).toBe("cache: 'npm'");
		expect(substitutions[INSTALL]).toBe('npm ci');
		expect(substitutions[RUN]).toBe('npm run');
	});
});
