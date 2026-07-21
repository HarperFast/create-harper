/**
 * Playwright global setup: boot one isolated Harper instance for the whole run, wait until it
 * accepts authenticated requests, and seed a known record so the browser scenario has data to
 * render. Returns a teardown function (Playwright calls it after the run) that stops Harper and
 * removes its scratch root.
 */
import { bootHarper } from './harper.js';

/** A record the browser spec expects to see rendered by the frontend component. */
export const SEED_WIDGET = { id: 'seed-1', name: 'E2E Seed Widget', quantity: 1 };

export default async function globalSetup() {
	const appDir = process.env.E2E_APP_DIR;
	if (!appDir) {
		throw new Error('E2E_APP_DIR is not set — run the suite via template.tests/e2e/run.js');
	}

	const harper = await bootHarper({ appDir, onLog: (chunk) => process.stdout.write(chunk) });

	try {
		// The exported table's REST endpoint is auth-gated, so a successful GET proves the schema
		// loaded AND the auth store is ready — both required before the specs run.
		await harper.waitUntilReady('/E2eWidget/');

		const seed = await fetch(`${harper.baseUrl}/E2eWidget/`, {
			method: 'POST',
			headers: {
				Authorization: harper.authorization,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify(SEED_WIDGET),
		});
		if (!seed.ok) {
			throw new Error(`Failed to seed E2eWidget: ${seed.status} ${await seed.text()}`);
		}
	} catch (error) {
		harper.stop();
		throw error;
	}

	return () => harper.stop();
}
