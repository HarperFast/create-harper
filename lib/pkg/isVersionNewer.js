/**
 * Simple semver comparison for version strings in the format x.y.z.
 *
 * @param {string} latest - The latest version string.
 * @param {string} current - The current version string.
 * @returns {boolean} - True if the latest version is newer than the current version, false otherwise.
 */
export function isVersionNewer(latest, current) {
	const l = latest.split('.').map(x => parseInt(x, 10));
	const c = current.split('.').map(x => parseInt(x, 10));

	for (let i = 0; i < 3; i++) {
		if (isNaN(l[i]) || isNaN(c[i])) { break; }
		if (l[i] > c[i]) { return true; }
		if (l[i] < c[i]) { return false; }
	}
	return false;
}
