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
