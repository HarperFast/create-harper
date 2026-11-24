// `deploy:setup-previews` runs this before `harper preview setup`, which checks the workflow it
// finds in `.github/workflows/`. Until then the workflow waits here, because GitHub runs everything
// in `.github/workflows/`: from December 2, 2026, a public repository with no Actions policy that
// allows `pull_request_target` fails each run of it before a job can skip.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('preview.yaml', import.meta.url));
const target = fileURLToPath(new URL('../workflows/preview.yaml', import.meta.url));
const shown = path.relative(process.cwd(), target);

/**
 * Copies the workflow into place, unless a file is already there.
 *
 * @returns {boolean} - Whether it copied the workflow.
 */
function install() {
	fs.mkdirSync(path.dirname(target), { recursive: true });
	try {
		fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
		return true;
	} catch (error) {
		if (error.code === 'EEXIST') {
			return false;
		}
		throw error;
	}
}

console.log(
	[
		`${install() ? 'Added' : 'Kept the existing'} ${shown}. Commit it to main only once setup succeeds:`,
		'pull_request_target runs the workflow from there. A public repository must',
		'allow pull_request_target first; see "Pull request previews" in README.md.',
	].join('\n'),
);
