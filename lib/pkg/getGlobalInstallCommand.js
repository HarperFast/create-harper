/**
 * Gets the global install command for a given package manager agent.
 *
 * @param {string} agent - The package manager agent (e.g., 'npm', 'pnpm', 'yarn', 'bun').
 * @param {string} packageName - The name of the package to install globally.
 * @returns {string[]} - An array containing the command and its arguments.
 */
export function getGlobalInstallCommand(agent, packageName) {
	switch (agent) {
		case 'pnpm':
			return [agent, 'add', '-g', packageName];
		case 'yarn':
			return [agent, 'global', 'add', packageName];
		case 'bun':
			return [agent, 'add', '-g', packageName];
		default:
			return [agent, 'install', '-g', packageName];
	}
}
