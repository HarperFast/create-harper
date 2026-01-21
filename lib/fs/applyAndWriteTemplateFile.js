import fs from 'node:fs';

export function applyAndWriteTemplateFile(targetPath, templatePath, substitutions) {
	let updatedContent = fs.readFileSync(templatePath, 'utf-8');
	for (const variableName in substitutions) {
		updatedContent = updatedContent.replaceAll(variableName, substitutions[variableName]);
	}
	fs.writeFileSync(targetPath, updatedContent);
}
