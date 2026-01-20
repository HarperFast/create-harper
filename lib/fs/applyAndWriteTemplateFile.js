import template from 'lodash/template.js';
import fs from 'node:fs';

export function applyAndWriteTemplateFile(targetPath, templatePath, context) {
	const templateContent = fs.readFileSync(templatePath, 'utf-8');
	const templateFn = template(templateContent, { interpolate: /<<([\s\S]+?)>>/g });
	const updatedContent = templateFn(context);
	fs.writeFileSync(targetPath, updatedContent);
}
