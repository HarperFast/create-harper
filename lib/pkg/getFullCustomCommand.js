export function getFullCustomCommand(customCommand, pkgInfo) {
	const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
	const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.');

	return (
		customCommand
			.replace(/^npm create (?:-- )?/, () => {
				// `bun create` uses it's own set of templates,
				// the closest alternative is using `bun x` directly on the package
				if (pkgManager === 'bun') {
					return 'bun x create-';
				}
				// Deno uses `run -A npm:create-` instead of `create` or `init` to also provide needed perms
				if (pkgManager === 'deno') {
					return 'deno run -A npm:create-';
				}
				// pnpm doesn't support the -- syntax
				if (pkgManager === 'pnpm') {
					return 'pnpm create ';
				}
				// For other package managers, preserve the original format
				return customCommand.startsWith('npm create -- ')
					? `${pkgManager} create -- `
					: `${pkgManager} create `;
			})
			// Only Yarn 1.x doesn't support `@version` in the `create` command
			.replace('@latest', () => (isYarn1 ? '' : '@latest'))
			.replace(/^npm exec /, () => {
				// Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
				if (pkgManager === 'pnpm') {
					return 'pnpm dlx ';
				}
				if (pkgManager === 'yarn' && !isYarn1) {
					return 'yarn dlx ';
				}
				if (pkgManager === 'bun') {
					return 'bun x ';
				}
				if (pkgManager === 'deno') {
					return 'deno run -A npm:';
				}
				// Use `npm exec` in all other cases,
				// including Yarn 1.x and other custom npm clients.
				return 'npm exec ';
			})
	);
}
