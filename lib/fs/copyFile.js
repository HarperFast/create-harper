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
 * @param {string} line - One line of the template's `.env` content.
 * @returns {boolean} Whether the line sets the target to a placeholder.
 */
function setsPlaceholderTarget(line) {
	return TARGET_ASSIGNMENT.test(line) && Object.values(dotenv.parse(line)).some((value) => DEFAULT_TARGETS.has(value));
}

/**
 * The CLI reads a target from `.env` ahead of the one `harper login` saves, so a placeholder there
 * would send every command to a host that doesn't exist. With no cluster URL supplied, the target
 * line is written commented out instead, and `harper login` adds the real one; when the existing
 * `.env` already sets a target, the line is left out.
 *
 * @param {string} templateEnv - The template's `.env` content, after substitution.
 * @param {string} [existingEnv] - The existing `.env` content, when the template is appended to it.
 * @returns {string} The template content to write.
 */
function withoutPlaceholderTarget(templateEnv, existingEnv = '') {
	const existing = dotenv.parse(existingEnv);
	const hasTarget = TARGET_KEYS.some((key) => existing[key]);
	return templateEnv
		.split('\n')
		.flatMap((line) => {
			if (!setsPlaceholderTarget(line)) {
				return [line];
			}
			return hasTarget ? [] : [`# ${line.trim()}`];
		})
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
	if (targetPath.endsWith('.env')) {
		if (fs.existsSync(targetPath)) {
			const existingContent = fs.readFileSync(targetPath, 'utf-8');
			updatedContent = `# Your .env file contents:
${existingContent}

# Harper .env contents:
${withoutPlaceholderTarget(updatedContent, existingContent)}`;
		} else {
			updatedContent = withoutPlaceholderTarget(updatedContent);
		}
	}
	writeFile(targetPath, updatedContent);

	console.log(' + ' + green(targetPath) + gray(' from ' + sourcePath));
}
