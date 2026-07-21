/**
 * Applies e2e fixtures onto a freshly generated app (in a throwaway directory), so a run can
 * exercise more of the app than the templates ship with.
 *
 * These fixtures live under template.tests/ — they are never in the published npm tarball (the
 * package.json `files` allowlist ships only the `template-*` dirs, `lib/`, and `index.js`) and
 * are only ever copied into throwaway generated copies, never into the `template-*` sources. So
 * none of this can leak into a real user's scaffolded app.
 *
 * Two tiers:
 *   - shared:    a schema (E2eWidget) + a custom resource (E2eEcho), applied to every template.
 *                This is the Harper API surface, which is framework-agnostic.
 *   - framework: a component that fetches E2eWidget and renders it, mounted into the app's entry.
 *                react/vue/vanilla only (SSR entries differ — see capabilities.js).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { capabilitiesFor } from './capabilities.js';

const fixturesDir = path.resolve(fileURLToPath(import.meta.url), '..', 'fixtures');

/**
 * @param {string} appDir - The generated app to overlay onto.
 * @param {string} templateName - Canonical template name (e.g. 'react-ts').
 * @returns {ReturnType<typeof capabilitiesFor>}
 */
export function applyOverlay(appDir, templateName) {
	const cap = capabilitiesFor(templateName);

	// Shared: schema + custom resource. Resource extension tracks the template's jsResource glob.
	copyInto(
		path.join(fixturesDir, 'shared', 'schemas', 'e2e.graphql'),
		path.join(appDir, 'schemas', 'e2e.graphql'),
	);
	copyInto(
		path.join(fixturesDir, 'shared', 'resources', 'e2eEcho.js'),
		path.join(appDir, 'resources', `e2eEcho.${cap.ext}`),
	);

	// Framework: the browser component + a mount appended to the app's entry.
	if (cap.browser) {
		applyFrontendOverlay(appDir, cap);
	}

	return cap;
}

function applyFrontendOverlay(appDir, cap) {
	if (cap.framework === 'react') {
		const componentExt = cap.ext === 'ts' ? 'tsx' : 'jsx';
		copyInto(
			path.join(fixturesDir, 'react', 'E2eWidgets.jsx'),
			path.join(appDir, 'src', `E2eWidgets.${componentExt}`),
		);
		// import is hoisted, so appending to the entry is legal ESM. Alias the react-dom import so
		// it can't collide with the entry's existing `createRoot` import.
		appendTo(
			path.join(appDir, 'src', `main.${componentExt}`),
			[
				'',
				'// --- create-harper e2e overlay ---',
				`import { E2eWidgets } from "./E2eWidgets.${componentExt}";`,
				'import { createRoot as e2eCreateRoot } from "react-dom/client";',
				'const e2eMount = document.createElement("div");',
				'document.body.appendChild(e2eMount);',
				'e2eCreateRoot(e2eMount).render(<E2eWidgets />);',
				'',
			].join('\n'),
		);
		return;
	}

	if (cap.framework === 'vue') {
		copyInto(
			path.join(fixturesDir, 'vue', 'E2eWidgets.vue'),
			path.join(appDir, 'src', 'E2eWidgets.vue'),
		);
		appendTo(
			path.join(appDir, 'src', `main.${cap.ext}`),
			[
				'',
				'// --- create-harper e2e overlay ---',
				'import E2eWidgets from "./E2eWidgets.vue";',
				'import { createApp as e2eCreateApp } from "vue";',
				'const e2eMount = document.createElement("div");',
				'document.body.appendChild(e2eMount);',
				'e2eCreateApp(E2eWidgets).mount(e2eMount);',
				'',
			].join('\n'),
		);
		return;
	}

	// vanilla: the frontend is plain files served statically from web/. Append a fetch that
	// builds the same data-testid structure the browser spec looks for.
	appendTo(
		path.join(appDir, 'web', 'index.js'),
		[
			'',
			'// --- create-harper e2e overlay ---',
			'(async () => {',
			'\tconst section = document.createElement("section");',
			'\tsection.setAttribute("data-testid", "e2e-widgets");',
			'\tconst list = document.createElement("ul");',
			'\tlist.setAttribute("data-testid", "e2e-widget-list");',
			'\tsection.appendChild(list);',
			'\tdocument.body.appendChild(section);',
			'\ttry {',
			'\t\tconst response = await fetch("/E2eWidget/", { headers: { Accept: "application/json" } });',
			'\t\tconst data = await response.json();',
			'\t\tfor (const widget of (Array.isArray(data) ? data : [])) {',
			'\t\t\tconst item = document.createElement("li");',
			'\t\t\titem.setAttribute("data-testid", "e2e-widget-item");',
			'\t\t\titem.textContent = widget.name;',
			'\t\t\tlist.appendChild(item);',
			'\t\t}',
			'\t} catch (cause) {',
			'\t\tconst problem = document.createElement("p");',
			'\t\tproblem.setAttribute("data-testid", "e2e-error");',
			'\t\tproblem.textContent = String(cause);',
			'\t\tsection.appendChild(problem);',
			'\t}',
			'})();',
			'',
		].join('\n'),
	);
}

function copyInto(from, to) {
	fs.mkdirSync(path.dirname(to), { recursive: true });
	fs.copyFileSync(from, to);
}

function appendTo(file, text) {
	if (!fs.existsSync(file)) {
		throw new Error(`overlay: expected entry file not found: ${file}`);
	}
	fs.appendFileSync(file, text);
}
