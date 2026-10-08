/**
 * The name a project deploys under. Harper accepts only letters, numbers, dashes and underscores in a
 * component name, and the name is substituted into shell commands in the scaffolded package scripts
 * and workflow, so a project directory named `my app` or `a; b` must not reach them as typed.
 *
 * @param {string} projectName - The name of the directory the project lives in.
 * @returns {string} - A component name made of `[A-Za-z0-9_-]`.
 */
export function toComponentName(projectName) {
	const name = String(projectName ?? '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	return name || 'app';
}
