/**
 * Simple semver comparison for x.y.z
 * @param {string} latest
 * @param {string} current
 * @returns {boolean}
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
