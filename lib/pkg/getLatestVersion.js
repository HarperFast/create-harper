/**
 * Fetches the latest version of a package from the npm registry.
 *
 * @param {string} packageName - The name of the package to check.
 * @returns {Promise<string | null>} - The latest version string, or null if it could not be fetched.
 */
export async function getLatestVersion(packageName) {
	try {
		const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
			signal: AbortSignal.timeout(1000), // 1 second timeout
		});
		if (!response.ok) {
			return null;
		}
		const data = await response.json();
		return data.version;
	} catch {
		return null;
	}
}
