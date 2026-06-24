import { App } from '@/App.tsx';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

/**
 * Server render entry. The Vite Harper plugin calls this (awaiting it) for HTML navigations and
 * injects the returned markup into the `<!--ssr-outlet-->` placeholder in index.html.
 *
 * To render with data already in place (no client-side fetch), read from Harper right here. The
 * `tables` registry is the same live, process-wide object available everywhere in Harper — the SSR
 * entry can reach it via `import { tables } from 'harper'` because Harper symlinks
 * `node_modules/harper` to the running install (and `vite.config.ts` keeps `harper` external). Make
 * `render` async and query a table, e.g.:
 *
 *     import { tables } from 'harper';
 *
 *     // The template's App takes no props — update App.tsx to accept `product`.
 *     export async function render(url: string): Promise<string> {
 *       const product = await tables.Product.get(idFromUrl(url));
 *       return renderToString(
 *         <StrictMode>
 *           <App product={product} />
 *         </StrictMode>,
 *       );
 *     }
 *
 * @param _url The request URL — use it to drive routing/data loading per request.
 */
export function render(_url: string): string {
	return renderToString(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
