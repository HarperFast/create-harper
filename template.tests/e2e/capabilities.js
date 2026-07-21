/**
 * Derives what an e2e run should do for a given template, entirely from its canonical name.
 *
 *   - ext:       resources are `.ts` for TypeScript templates, `.js` otherwise.
 *   - framework: which frontend overlay to apply (react / vue / vanilla).
 *   - ssr:       server-rendered templates use an entry-client/entry-server split rather than a
 *                single `main` entry, so the browser-component overlay doesn't apply (yet). They
 *                still run the full HTTP suite (CRUD, custom resource, frontend-served).
 *   - browser:   whether to apply the frontend component overlay and run the browser spec.
 */

/** @param {string} templateName */
export function capabilitiesFor(templateName) {
	const ext = templateName.includes('-ts') ? 'ts' : 'js';
	const framework = templateName.startsWith('react')
		? 'react'
		: templateName.startsWith('vue')
		? 'vue'
		: 'vanilla';
	const ssr = templateName.endsWith('-ssr');
	return { templateName, ext, framework, ssr, browser: !ssr };
}
