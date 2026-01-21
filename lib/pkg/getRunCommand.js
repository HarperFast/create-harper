/**
 * Gets the run command for a given package manager agent and script name.
 *
 * @param {string} agent - The package manager agent (e.g., 'npm', 'pnpm', 'yarn', 'bun', 'deno').
 * @param {string} script - The name of the script to run.
 * @returns {string[]} - An array containing the command and its arguments.
 */
export function getRunCommand(agent, script) {
	switch (agent) {
		case 'yarn':
		case 'pnpm':
		case 'bun':
			return [agent, script];
		case 'deno':
			return [agent, 'task', script];
		default:
			return [agent, 'run', script];
	}
}
