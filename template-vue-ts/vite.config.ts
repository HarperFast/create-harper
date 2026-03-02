import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
	],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
		},
	},
	build: {
		outDir: 'web',
		emptyOutDir: true,
		rolldownOptions: {
			external: ['**/*.test.*', '**/*.spec.*'],
		},
	},
});
