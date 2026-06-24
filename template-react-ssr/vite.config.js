import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
	],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
		},
	},
	ssr: {
		// Keep `harper` external so the SSR entry resolves it to Harper's running runtime instead of
		// bundling it. `node_modules/harper` is symlinked to the running install, and symlinked deps
		// aren't reliably auto-externalized for SSR — this is what lets `import { tables } from 'harper'`
		// in entry-server read live data. See src/entry-server.jsx.
		external: ['harper'],
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rolldownOptions: {
			external: ['**/*.test.*', '**/*.spec.*'],
		},
	},
});
