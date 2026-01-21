/**
 * Formats a target directory string by trimming whitespace and removing trailing slashes.
 *
 * @param {string} targetDir - The raw target directory string.
 * @returns {string} - The formatted target directory string.
 */
export function formatTargetDir(targetDir) {
	return targetDir.trim().replace(/\/+$/g, '');
}
