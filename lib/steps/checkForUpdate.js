import spawn from 'cross-spawn';
import fs from 'node:fs';
import pc from 'picocolors';
import { getLatestVersion } from '../pkg/getLatestVersion.js';
import { isVersionNewer } from '../pkg/isVersionNewer.js';

/**
 * Checks if a newer version of create-harper is available on npm.
 * If a newer version exists, it attempts to re-run the process using npx with the latest version.
 *
 * @returns {Promise<string>} - The current version of the package.
 */
export async function checkForUpdate() {
	const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));
	const currentVersion = pkg.version;

	if (process.env.CREATE_HARPER_SKIP_UPDATE) {
		return currentVersion;
	}

	try {
		const latestVersion = await getLatestVersion(pkg.name);

		if (latestVersion && isVersionNewer(latestVersion, currentVersion)) {
			console.log(
				pc.yellow(
					`\nA new version of ${pc.bold(pkg.name)} is available! (${pc.dim(currentVersion)} -> ${
						pc.green(latestVersion)
					})`,
				),
			);
			console.log(`Automatically updating to the latest version...\n`);

			// Clear the npx cache for this package to ensure we get the latest version
			const lsResult = spawn.sync('npm', ['cache', 'npx', 'ls', pkg.name], {
				encoding: 'utf-8',
			});

			if (lsResult.stdout) {
				const keys = lsResult.stdout
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line.includes(':'))
					.filter((line) => {
						const [, pkgPart] = line.split(':');
						return pkgPart && pkgPart.trim().startsWith(`${pkg.name}@`);
					})
					.map((line) => line.split(':')[0].trim());

				if (keys.length > 0) {
					spawn.sync('npm', ['cache', 'npx', 'rm', ...keys], {
						stdio: 'inherit',
					});
				}
			}

			const result = spawn.sync('npx', ['-y', `${pkg.name}@latest`, ...process.argv.slice(2)], {
				stdio: 'inherit',
			});

			process.exit(result.status ?? 0);
		}
	} catch {
		// Ignore errors, we don't want to block the user if the check fails
	}

	return currentVersion;
}
