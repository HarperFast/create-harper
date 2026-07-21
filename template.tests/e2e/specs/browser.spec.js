/**
 * The end-to-end story: a real frontend component, running in a browser, fetches Harper's
 * auto-REST API and renders the result. The overlay (template.tests/e2e/overlay.js) mounts a
 * component that lists the E2eWidget table; globalSetup seeded one known record; this spec loads
 * the built app and asserts that record shows up in the DOM.
 *
 * Gated on E2E_BROWSER, which run.js sets only for templates that got a frontend overlay
 * (react/vue/vanilla SPAs). SSR templates are covered by the HTTP specs for now.
 */
import { expect, test } from '@playwright/test';
import { SEED_WIDGET } from '../globalSetup.js';

test.describe('frontend consumes the Harper API', () => {
	test.skip(process.env.E2E_BROWSER !== '1', 'no frontend component overlay for this template');

	test('a component renders data fetched from the auto-REST API', async ({ page }) => {
		await page.goto('/');

		const seeded = page.getByTestId('e2e-widget-item').filter({ hasText: SEED_WIDGET.name });
		await expect(seeded.first()).toBeVisible({ timeout: 15_000 });
	});
});
