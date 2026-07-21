/**
 * The schema-driven auto-REST CRUD lifecycle — the Harper API surface a generated app relies on
 * most, and the one most likely to shift between Harper versions. The exact status codes are
 * asserted deliberately: this suite is a canary for Harper prereleases, so a changed contract
 * (e.g. create no longer 201, delete no longer 200) should surface as a failure to triage.
 *
 * Verified against Harper 5.1.22:
 *   POST   /E2eWidget/       -> 201, body is the new id
 *   GET    /E2eWidget/{id}   -> 200, the record
 *   PATCH  /E2eWidget/{id}   -> 204, no body
 *   GET    /E2eWidget/?fiql  -> 200, filtered array
 *   DELETE /E2eWidget/{id}   -> 200, true
 *   GET    /E2eWidget/{id}   -> 404 once deleted
 */
import { expect, test } from '@playwright/test';

const id = 'crud-1';
const json = { 'Content-Type': 'application/json' };

test('auto-REST CRUD lifecycle over the exported schema table', async ({ request }) => {
	const created = await request.post('/E2eWidget/', { headers: json, data: { id, name: 'Gizmo', quantity: 7 } });
	expect(created.status(), 'POST create').toBe(201);

	const read = await request.get(`/E2eWidget/${id}`);
	expect(read.status(), 'GET by id').toBe(200);
	expect(await read.json()).toMatchObject({ id, name: 'Gizmo', quantity: 7 });

	const patched = await request.patch(`/E2eWidget/${id}`, { headers: json, data: { quantity: 99 } });
	expect(patched.status(), 'PATCH update').toBe(204);

	const afterPatch = await request.get(`/E2eWidget/${id}`);
	expect((await afterPatch.json()).quantity, 'PATCH persisted').toBe(99);

	// FIQL-style filtering via query parameters.
	const filtered = await request.get('/E2eWidget/?quantity=gt=50');
	expect(filtered.status(), 'GET filtered list').toBe(200);
	const rows = await filtered.json();
	expect(Array.isArray(rows), 'list is an array').toBe(true);
	expect(rows.some((row) => row.id === id), 'filter matched the updated record').toBe(true);

	const deleted = await request.delete(`/E2eWidget/${id}`);
	expect(deleted.status(), 'DELETE').toBe(200);

	const afterDelete = await request.get(`/E2eWidget/${id}`);
	expect(afterDelete.status(), 'GET after delete').toBe(404);
});
