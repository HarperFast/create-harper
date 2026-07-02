import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

// Every template directory on disk with a config.yaml, whether or not it is in the published catalog.
const templateDirs = fs.readdirSync(root)
	.filter((name) => name.startsWith('template-') && fs.existsSync(path.join(root, name, 'config.yaml')));

/**
 * Harper's `static` handler runs before authentication and the REST handler in the HTTP
 * middleware chain (`runFirst: true` on Harper 5.0.x, `before: 'authentication'` on 5.1+).
 * A `notFound` catch-all combined with `fallthrough: false` therefore answers every GET —
 * including requests for the application's exported resources — with the fallback file,
 * making the REST API unreachable over GET. Templates must serve real files only and let
 * misses fall through; client-side routing should be hash-based so every page loads from `/`.
 */
describe('template static config does not black-hole REST GETs', () => {
	test('finds template configs to check', () => {
		expect(templateDirs.length).toBeGreaterThan(0);
	});

	for (const dir of templateDirs) {
		test(`${dir} static handler lets unmatched requests fall through`, () => {
			const config = fs.readFileSync(path.join(root, dir, 'config.yaml'), 'utf-8');
			const withoutComments = config
				.split('\n')
				.filter((line) => !line.trim().startsWith('#'))
				.join('\n');

			expect(withoutComments).not.toMatch(/fallthrough:\s*false/);
			expect(withoutComments).not.toMatch(/notFound:/);
		});
	}
});
