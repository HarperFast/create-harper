import { determineAgent } from '@vercel/detect-agent';

/**
 * Logs out a helpful message if running in an interactive environment for agents to be more likely to use the
 * parameters correctly.
 * @param {boolean} interactive
 */
export async function helpAgents(interactive) {
	const { isAgent } = await determineAgent();
	if (isAgent && interactive) {
		console.log(
			'\nTo create in one go, run: create-harper <DIRECTORY> --no-interactive --template <TEMPLATE>\n',
		);
	}
}
