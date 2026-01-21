import * as prompts from '@clack/prompts';
import { frameworks } from '../constants/frameworks.js';
import { templates } from '../constants/templates.js';

/**
 * Step 4: Choose a project template (framework and variant).
 *
 * @param {string | undefined} argTemplate - The template name provided via CLI arguments.
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @returns {Promise<{template: string, cancelled: boolean}>} - The selected template name and cancellation status.
 */
export async function getTemplate(argTemplate, interactive) {
	let template = argTemplate;
	let hasInvalidArgTemplate = false;

	if (argTemplate && !templates.includes(argTemplate)) {
		template = undefined;
		hasInvalidArgTemplate = true;
	}

	if (!template) {
		if (interactive) {
			const framework = await prompts.select({
				message: hasInvalidArgTemplate
					? `"${argTemplate}" isn't a valid template. Please choose from below: `
					: 'Select a framework:',
				options: frameworks
					.filter(framework => !framework.hidden)
					.map((framework) => {
						const frameworkColor = framework.color;
						return {
							label: frameworkColor(framework.display),
							value: framework,
						};
					}),
			});

			if (prompts.isCancel(framework)) {
				return { template: '', cancelled: true };
			}

			const variant = framework.variants.length === 1
				? framework.variants[0].name
				: await prompts.select({
					message: 'Select a variant:',
					options: framework.variants.map((variant) => {
						const variantColor = variant.color;
						return {
							label: variantColor(variant.display || variant.name),
							value: variant.name,
						};
					}),
				});

			if (prompts.isCancel(variant)) {
				return { template: '', cancelled: true };
			}

			template = variant;
		} else {
			template = 'vanilla-ts';
		}
	}

	return { template, cancelled: false };
}
