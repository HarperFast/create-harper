import fs from 'node:fs';

/**
 * Reads a template file, applies string substitutions, and writes the result to a target path.
 *
 * @param {string} targetPath - The path where the processed file will be written.
 * @param {string} templatePath - The path to the source template file.
 * @param {Record<string, string>} substitutions - A mapping of strings to replace in the file content.
 */
export function applyAndWriteTemplateFile(targetPath, templatePath, substitutions) {
	let updatedContent = fs.readFileSync(templatePath, 'utf-8');
	for (const variableName in substitutions) {
		updatedContent = updatedContent.replaceAll(variableName, substitutions[variableName]);
	}
	fs.writeFileSync(targetPath, updatedContent);
}
