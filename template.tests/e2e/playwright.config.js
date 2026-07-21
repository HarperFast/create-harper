import { defineConfig } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import { authHeader } from './harper.js';

const httpPort = Number(process.env.SMOKE_HTTP_PORT ?? 19926);

/**
 * The e2e run is driven by template.tests/e2e/run.js, which generates an app, overlays fixtures,
 * installs + builds it, then invokes Playwright with the app details in the environment:
 *
 *   E2E_APP_DIR   the generated app to boot Harper against (required)
 *   E2E_TEMPLATE  the template name (for reporting)
 *   E2E_BROWSER   '1' when a frontend component overlay was applied (gates the browser spec)
 *   HARPER_BIN    the harper CLI to run — this is how the Harper version under test is pinned
 *
 * globalSetup boots one shared Harper instance and seeds a known record; specs run serially
 * against it (workers: 1) so the CRUD lifecycle can't race the seeded browser scenario.
 */
export default defineConfig({
	testDir: './specs',
	globalSetup: './globalSetup.js',
	outputDir: path.join(os.tmpdir(), 'cha-e2e-artifacts'),
	timeout: 30_000,
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? [['github'], ['list']] : [['list']],
	use: {
		baseURL: `http://127.0.0.1:${httpPort}`,
		// Every request (API fetches from specs and the browser alike) authenticates as the
		// throwaway superuser, so scenarios don't each have to log in.
		extraHTTPHeaders: { Authorization: authHeader() },
		trace: 'retain-on-failure',
	},
});
