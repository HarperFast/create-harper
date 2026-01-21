/**
 * Parses the package manager name and version from a User-Agent string.
 *
 * @param {string | undefined} userAgent - The User-Agent string (usually from process.env.npm_config_user_agent).
 * @returns {{name: string, version: string} | undefined} - An object with the package manager name and version, or undefined if not provided.
 */
export function pkgFromUserAgent(userAgent) {
	if (!userAgent) { return undefined; }
	const pkgSpec = userAgent.split(' ')[0];
	const pkgSpecArr = pkgSpec.split('/');
	return {
		name: pkgSpecArr[0],
		version: pkgSpecArr[1],
	};
}
