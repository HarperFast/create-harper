import fs from 'node:fs';
import colors from 'picocolors';

const {
	gray,
	green,
} = colors;

/**
 * Reads a template file, applies string substitutions, and writes the result to a target path.
 *
 * @param {string} sourcePath - The path to the source template file.
 * @param {string} targetPath - The path where the processed file will be written.
 * @param {Record<string, string> | ((content: string, sourcePath: string, targetPath: string) => string)} [substitutions] - A mapping of strings to replace or a function that returns the updated content.
 */
export function copyFile(sourcePath, targetPath, substitutions) {
	let updatedContent = fs.readFileSync(sourcePath, 'utf-8');
	if (typeof substitutions === 'function') {
		updatedContent = substitutions(updatedContent, sourcePath, targetPath);
	} else if (substitutions) {
		for (const variableName in substitutions) {
			updatedContent = updatedContent.replaceAll(variableName, substitutions[variableName]);
		}
	}

	console.log(' + ' + green(targetPath) + gray(' from ' + sourcePath));
	fs.writeFileSync(targetPath, updatedContent);
}
