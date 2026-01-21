/**
 * Checks if a string is a valid npm package name.
 *
 * @param {string} projectName - The name to validate.
 * @returns {boolean} - True if the name is valid, false otherwise.
 */
export function isValidPackageName(projectName) {
	return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
		projectName,
	);
}
