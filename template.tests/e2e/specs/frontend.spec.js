/**
 * SPA templates serve a frontend at `/` (built to dist/ for the Vite templates, static web/ for
 * vanilla). A miss here means the static component isn't serving the app — or is swallowing
 * requests it shouldn't.
 *
 * Gated off for SSR templates: their `static` handler sets `index: false` and `/` is served by
 * the SSR entry-server, which behaves differently under `harper run` (local validation saw a 404).
 * That serving path needs its own validation before this asserts — see the e2e README. SSR
 * templates still run the framework-agnostic API specs (CRUD + custom resource).
 */
import { expect, test } from '@playwright/test';

test.describe('frontend serving', () => {
	test.skip(process.env.E2E_SSR === '1', 'SSR index serving is validated separately (see e2e README)');

	test('frontend index is served at /', async ({ request }) => {
		const response = await request.get('/');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('text/html');
		expect((await response.text()).toLowerCase()).toContain('<html');
	});
});
