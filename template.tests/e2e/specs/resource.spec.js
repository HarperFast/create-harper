/**
 * A custom resource (resources/e2eEcho.{js,ts}) must load via jsResource and answer GET with its
 * own JSON. This is also the original runtimeSmoke regression check: the static handler runs
 * before the REST handler, and a `notFound` + `fallthrough: false` catch-all would swallow this
 * request and answer with index.html instead of the resource's JSON.
 */
import { expect, test } from '@playwright/test';

test('custom resource answers GET with its own JSON', async ({ request }) => {
	const response = await request.get('/E2eEcho/');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type'], 'a custom resource, not the static fallback')
		.toContain('application/json');
	expect(await response.json()).toEqual({ echo: 'ok' });
});
