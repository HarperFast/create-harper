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
	if (!name) { return 'app'; }
	// The harper CLI JSON-parses each `key=value` argument, so `2026` or `true` would arrive as a number
	// or a boolean rather than a name.
	try {
		JSON.parse(name);
		return `app-${name}`;
	} catch {
		return name;
	}
}
