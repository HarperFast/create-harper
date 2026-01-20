export function getInstallCommand(agent) {
	if (agent === 'yarn') {
		return [agent];
	}
	return [agent, 'install'];
}
