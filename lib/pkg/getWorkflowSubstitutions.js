// Indentation of the scaffolded GitHub Actions workflows (2-space YAML, so a `steps:` entry's
// `-` sits six columns in). Each multi-line value below replaces a placeholder comment that
// already sits at that indent, so a value's *first* line carries no indentation and every
// continuation line carries it explicitly.
const STEP_INDENT = ' '.repeat(6);
const KEY_INDENT = ' '.repeat(2);
const INPUT_INDENT = ' '.repeat(4);

/**
 * Builds one `steps:` entry, or a bare comment when a package manager needs no setup step.
 *
 * @param {{name?: string, comment?: string[], uses?: string, inputs?: Record<string, string>}} step
 * @returns {string} - The step's YAML, indented for substitution into the workflow.
 */
function buildStep({ name, comment, uses, inputs }) {
	const lines = [];
	if (name) { lines.push(`- name: ${name}`); }
	for (const line of comment ?? []) {
		// A comment-only value stands in for a step, so it starts at the step indent; a comment
		// documenting a step is nested with that step's other keys.
		lines.push(`${name ? KEY_INDENT : ''}# ${line}`);
	}
	if (uses) { lines.push(`${KEY_INDENT}uses: ${uses}`); }
	if (inputs) {
		lines.push(`${KEY_INDENT}with:`);
		for (const [input, value] of Object.entries(inputs)) {
			lines.push(`${INPUT_INDENT}${input}: ${value}`);
		}
	}
	return lines.join(`\n${STEP_INDENT}`);
}

/**
 * Extracts the major version from a package manager version string.
 *
 * @param {string | undefined} version - A version such as '4.9.1'.
 * @returns {number | undefined} - The major version, or undefined if it can't be determined.
 */
function majorVersion(version) {
	const major = Number.parseInt(version ?? '', 10);
	return Number.isNaN(major) ? undefined : major;
}

/**
 * Builds the step that puts the project's package manager on PATH, pinned to the version that
 * generated its lockfile. npm and Yarn need none — npm ships with Node.js, and Yarn is
 * preinstalled on GitHub's Ubuntu runners — so they get a comment saying so instead.
 *
 * @param {string} agent - The package manager agent ('npm', 'pnpm', 'yarn', 'bun' or 'deno').
 * @param {string} [version] - The agent's version, as reported by the user agent that invoked us.
 * @returns {string} - The step's YAML.
 */
function getSetupStep(agent, version) {
	switch (agent) {
		case 'pnpm':
			return buildStep({
				name: 'Set up pnpm',
				comment: [
					"Pinned to the pnpm that wrote this project's lockfile. The action is SHA-pinned, but a",
					'floating `version:` would still let it self-install an unvetted pnpm at run time.',
				],
				uses: 'pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271 # v6.0.9',
				inputs: { version: version ?? 'latest' },
			});
		case 'bun':
			return buildStep({
				name: 'Set up Bun',
				comment: ["Pinned to the Bun that wrote this project's lockfile."],
				uses: 'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0',
				inputs: { 'bun-version': version ?? 'latest' },
			});
		case 'deno':
			return buildStep({
				name: 'Set up Deno',
				comment: ["Pinned to the Deno that wrote this project's lockfile."],
				uses: 'denoland/setup-deno@22d081ff2d3a40755e97629de92e3bcbfa7cf2ed # v2.0.5',
				inputs: { 'deno-version': version ?? 'vx.x.x' },
			});
		case 'yarn':
			return buildStep({
				comment: [
					"Yarn is preinstalled on GitHub's Ubuntu runners, so it needs no setup step. On Yarn 2+,",
					'commit `.yarnrc.yml` with a `yarnPath` (`yarn set version`) so CI runs the same Yarn that',
					"wrote yarn.lock rather than the runner's Yarn 1.x.",
				],
			});
		default:
			return buildStep({ comment: ['npm ships with Node.js, so it needs no setup step.'] });
	}
}

/**
 * Builds `actions/setup-node`'s `cache:` input. Only npm, Yarn and pnpm are supported there;
 * Bun and Deno cache through their own setup actions, so they get a comment explaining the gap
 * rather than an input setup-node would reject.
 *
 * @param {string} agent - The package manager agent ('npm', 'pnpm', 'yarn', 'bun' or 'deno').
 * @returns {string} - The `cache:` input, or a comment.
 */
function getNodeCacheInput(agent) {
	switch (agent) {
		case 'bun':
			return "# setup-node caches npm, Yarn and pnpm only; oven-sh/setup-bun caches Bun's store itself.";
		case 'deno':
			return '# setup-node caches npm, Yarn and pnpm only; denoland/setup-deno caches DENO_DIR itself.';
		case 'pnpm':
		case 'yarn':
			return `cache: '${agent}'`;
		default:
			return "cache: 'npm'";
	}
}

/**
 * Gets the lockfile-respecting install command for CI, which must fail rather than update the
 * lockfile when it has drifted from package.json.
 *
 * @param {string} agent - The package manager agent ('npm', 'pnpm', 'yarn', 'bun' or 'deno').
 * @param {string} [version] - The agent's version, as reported by the user agent that invoked us.
 * @returns {string} - The install command.
 */
function getCiInstallCommand(agent, version) {
	switch (agent) {
		case 'pnpm':
		case 'bun':
			return `${agent} install --frozen-lockfile`;
		case 'yarn':
			// Yarn renamed the flag in 2.0; Yarn 1 rejects `--immutable` and Yarn 2+ rejects
			// `--frozen-lockfile`, so pick by the version that scaffolded the project.
			return (majorVersion(version) ?? 1) >= 2 ? 'yarn install --immutable' : 'yarn install --frozen-lockfile';
		case 'deno':
			return 'deno install --frozen';
		default:
			return 'npm ci';
	}
}

/**
 * Gets the command prefix that runs a package.json script, e.g. `npm run` in `npm run deploy`.
 *
 * @param {string} agent - The package manager agent ('npm', 'pnpm', 'yarn', 'bun' or 'deno').
 * @returns {string} - The prefix, without a trailing space.
 */
function getRunScriptPrefix(agent) {
	switch (agent) {
		case 'deno':
			return 'deno task';
		case 'pnpm':
		case 'yarn':
		case 'bun':
			return `${agent} run`;
		default:
			return 'npm run';
	}
}

/**
 * Builds the substitutions that adapt a scaffolded project's GitHub Actions workflows to the
 * package manager that invoked us. Without them the workflows would hard-code npm and fail for
 * everyone else: setup-node can't resolve a package lock for a project whose lockfile is
 * `pnpm-lock.yaml`, and `npm ci` errors out before the job ever reaches tests or deploy.
 *
 * Placeholders that stand in for a whole line are written as YAML comments in the templates, so
 * the committed workflows stay valid, formattable YAML; the indentation contract for their
 * multi-line replacements lives in this module.
 *
 * @param {string} agent - The package manager agent ('npm', 'pnpm', 'yarn', 'bun' or 'deno').
 * @param {string} [version] - The agent's version, as reported by the user agent that invoked us.
 * @returns {Record<string, string>} - A mapping of placeholder to replacement.
 */
export function getWorkflowSubstitutions(agent, version) {
	return {
		'# your-package-manager-setup-step-here': getSetupStep(agent, version),
		'# your-package-manager-node-cache-here': getNodeCacheInput(agent),
		'your-package-manager-install-here': getCiInstallCommand(agent, version),
		'your-package-manager-run-here': getRunScriptPrefix(agent),
	};
}
