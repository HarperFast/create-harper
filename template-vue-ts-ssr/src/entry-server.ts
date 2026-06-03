import App from '@/App.vue';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

/**
 * Server render entry. The Vite Harper plugin calls this for HTML navigations and injects the
 * returned markup into the `<!--ssr-outlet-->` placeholder in index.html.
 *
 * @param _url The request URL — use it to drive routing/data loading per request.
 */
export function render(_url: string): Promise<string> {
	return renderToString(createSSRApp(App));
}
