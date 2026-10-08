import dotenv from 'dotenv';
import fs from 'node:fs';
import colors from 'picocolors';
import { defaultTarget } from '../constants/defaultEnv.js';
import { applySubstitutions, writeFile } from './writeFile.js';

const {
	gray,
	green,
} = colors;

const TARGET_KEYS = ['HARPER_CLI_TARGET', 'CLI_TARGET'];
const DEFAULT_TARGETS = new Set([defaultTarget, 'your-fabric.harper.fast-cluster-url-here']);
const TARGET_ASSIGNMENT = /^[ \t]*(?:export[ \t]+)?(?:HARPER_CLI_TARGET|CLI_TARGET)[ \t]*=/;

/**
 * @param {string} existingEnv - The existing `.env` content.
 * @param {string} templateEnv - The template's `.env` content, after substitution.
 * @returns {string} The template content to append. The last assignment wins, so a default
 * target appended after a configured one would replace it.
 */
function harperEnvToAppend(existingEnv, templateEnv) {
	const existing = dotenv.parse(existingEnv);
	const template = dotenv.parse(templateEnv);
	const keepsConfiguredTarget = TARGET_KEYS.some((key) => existing[key])
		&& TARGET_KEYS.some((key) => DEFAULT_TARGETS.has(template[key]));
	if (!keepsConfiguredTarget) {
		return templateEnv;
	}
	return templateEnv
		.split('\n')
		.filter((line) => !TARGET_ASSIGNMENT.test(line))
		.join('\n');
}

/**
 * Reads a template file, applies string substitutions, and writes the result to a target path.
 *
 * @param {string} sourcePath - The path to the source template file.
 * @param {string} targetPath - The path where the processed file will be written.
 * @param {Record<string, string> | ((content: string, targetPath: string) => string)} [substitutions] - A mapping of strings to replace or a function that returns the updated content.
 */
export function copyFile(sourcePath, targetPath, substitutions) {
	let updatedContent = applySubstitutions(fs.readFileSync(sourcePath, 'utf-8'), targetPath, substitutions);
	if (targetPath.endsWith('.env') && fs.existsSync(targetPath)) {
		const existingContent = fs.readFileSync(targetPath, 'utf-8');
		updatedContent = `# Your .env file contents:
${existingContent}

# Harper .env contents:
${harperEnvToAppend(existingContent, updatedContent)}`;
	}
	writeFile(targetPath, updatedContent);

	console.log(' + ' + green(targetPath) + gray(' from ' + sourcePath));
}
