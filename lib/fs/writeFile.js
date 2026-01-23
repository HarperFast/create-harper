import fs from 'node:fs';

/**
 * Applies string substitutions and writes the result to a target path.
 *
 * @param {string} targetPath - The path where the processed file will be written.
 * @param {string} content - The raw content to write, before optional substitutions.
 * @param {Record<string, string> | ((content: string, targetPath: string) => string)} [substitutions] - A mapping of strings to replace or a function that returns the updated content.
 */
export function writeFile(targetPath, content, substitutions) {
	let updatedContent = content;
	if (typeof substitutions === 'function') {
		updatedContent = substitutions(updatedContent, targetPath);
	} else if (substitutions) {
		for (const variableName in substitutions) {
			updatedContent = updatedContent.replaceAll(variableName, substitutions[variableName]);
		}
	}
	fs.writeFileSync(targetPath, updatedContent);
}
