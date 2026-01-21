import spawn from 'cross-spawn';

/**
 * Runs a command synchronously using cross-spawn.
 *
 * @param {string[]} commandArgs - An array containing the command and its arguments.
 * @param {import('child_process').SpawnSyncOptions} [options] - Options for the spawn sync process.
 */
export function run([command, ...args], options) {
	const { status, error } = spawn.sync(command, args, options);
	if (status != null && status > 0) {
		process.exit(status);
	}

	if (error) {
		console.error(`\n${command} ${args.join(' ')} error!`);
		console.error(error);
		process.exit(1);
	}
}
