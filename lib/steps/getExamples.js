import * as prompts from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exampleFiles } from '../constants/exampleFiles.js';

/**
 * Step 5 (Optional): Choose which example files to include in the project.
 *
 * @param {string} template - The selected template name.
 * @param {boolean} interactive - Whether the CLI is running in interactive mode.
 * @returns {Promise<{excludedFiles: string[], cancelled: boolean}>} - A list of files to exclude based on selection, and cancellation status.
 */
export async function getExamples(template, interactive) {
	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'..',
		'..',
		'..',
		`template-${template}`,
	);

	const availableExamples = exampleFiles.filter((example) =>
		example.files.some((file) => fs.existsSync(path.join(templateDir, file)))
	);

	if (availableExamples.length === 0 || !interactive) {
		return { excludedFiles: [], cancelled: false };
	}

	const selectedExamples = await prompts.multiselect({
		message: 'Select examples to include:',
		options: availableExamples.map((example) => ({
			label: example.label,
			value: example.value,
		})),
		initialValues: availableExamples.map((example) => example.value),
		required: false,
	});

	if (prompts.isCancel(selectedExamples)) {
		return { excludedFiles: [], cancelled: true };
	}

	const unselectedExamples = availableExamples.filter((example) => !selectedExamples.includes(example.value));
	const excludedFiles = unselectedExamples.flatMap((example) => example.files);

	return { excludedFiles, cancelled: false };
}
