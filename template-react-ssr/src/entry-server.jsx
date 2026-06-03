import { App } from '@/App.jsx';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

/**
 * Server render entry. The Vite Harper plugin calls this for HTML navigations and injects the
 * returned markup into the `<!--ssr-outlet-->` placeholder in index.html.
 *
 * @param {string} _url The request URL — use it to drive routing/data loading per request.
 * @returns {string}
 */
export function render(_url) {
	return renderToString(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
