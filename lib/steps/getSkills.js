import * as prompts from '@clack/prompts';

/**
 * Step 6: Choose whether to install Harper AI skills and for which agents.
 *
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @param {string} [argSkills] - The skills specified in the command line args.
 * @param {string} [argAgents] - The agents specified in the command line args.
 * @param {boolean} [argSkipSkills] - Whether to skip skills installation.
 * @returns {Promise<{selectedSkills: string[], selectedAgents: string[], cancelled: boolean}>}
 */
export async function getSkills(interactive, argSkills, argAgents, argSkipSkills) {
	if (argSkipSkills) {
		return { selectedSkills: [], selectedAgents: [], cancelled: false };
	}

	let selectedSkills = argSkills ? argSkills.split(',') : ['*'];
	let selectedAgents = argAgents ? argAgents.split(',') : [];

	if (interactive && !argSkills && !argAgents) {
		const installSkills = await prompts.confirm({
			message: 'Would you like to install Harper AI skills to your IDE/agent?',
			initialValue: true,
		});

		if (prompts.isCancel(installSkills)) {
			return { selectedSkills: [], selectedAgents: [], cancelled: true };
		}

		if (!installSkills) {
			return { selectedSkills: [], selectedAgents: [], cancelled: false };
		}

		const agents = await prompts.multiselect({
			message: 'Which AI agents do you use? (Press <space> to select, <enter> to submit)',
			options: [
				{ value: 'auto', label: 'Just detect', hint: 'Auto-detect current environment' },
				{ value: 'claude-code', label: 'Claude Code', hint: 'https://claude.com/product/claude-code' },
				{ value: 'codex', label: 'OpenAI Codex', hint: 'https://chatgpt.com/codex' },
				{ value: 'copilot', label: 'GitHub Copilot', hint: 'https://github.com/features/copilot' },
				{ value: 'cursor', label: 'Cursor', hint: 'https://cursor.com/' },
				{ value: 'windsurf', label: 'Windsurf', hint: 'https://windsurf.com/' },
				{ value: 'all', label: 'All supported agents', hint: '40+ agents' },
			],
			required: false,
		});

		if (prompts.isCancel(agents)) {
			return { selectedSkills: [], selectedAgents: [], cancelled: true };
		}

		selectedAgents = agents;
		if (agents.includes('all')) {
			selectedAgents = ['*'];
		} else if (agents.includes('auto')) {
			selectedAgents = [];
		}
	}

	return { selectedSkills, selectedAgents, cancelled: false };
}
