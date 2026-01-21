/**
 * Gets the install command for a given package manager agent.
 *
 * @param {string} agent - The package manager agent (e.g., 'npm', 'pnpm', 'yarn', 'bun').
 * @returns {string[]} - An array containing the command and its arguments.
 */
export function getInstallCommand(agent) {
	if (agent === 'yarn') {
		return [agent];
	}
	return [agent, 'install'];
}
