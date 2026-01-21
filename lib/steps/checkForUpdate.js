import spawn from 'cross-spawn';
import fs from 'node:fs';
import pc from 'picocolors';
import { getLatestVersion } from '../pkg/getLatestVersion.js';
import { isVersionNewer } from '../pkg/isVersionNewer.js';

/**
 * Checks if the current version of the package is the latest version on npm.
 * If not, it tries to re-run the command using npx with the @latest tag.
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
					`\n  A new version of ${pc.bold(pkg.name)} is available! (${pc.dim(currentVersion)} -> ${
						pc.green(latestVersion)
					})`,
				),
			);
			console.log(`  Automatically updating to the latest version...\n`);

			const result = spawn.sync('npx', [`${pkg.name}@latest`, ...process.argv.slice(2)], {
				stdio: 'inherit',
			});

			process.exit(result.status ?? 0);
		}
	} catch {
		// Ignore errors, we don't want to block the user if the check fails
	}

	return currentVersion;
}
