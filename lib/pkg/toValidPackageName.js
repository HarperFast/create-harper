/**
 * Converts a string into a valid npm package name.
 *
 * @param {string} projectName - The string to convert.
 * @returns {string} - A valid npm package name.
 */
export function toValidPackageName(projectName) {
	return projectName
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/^[._]/, '')
		.replace(/[^a-z\d\-~]+/g, '-')
		.replace(/-+$/, '');
}
