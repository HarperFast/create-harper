import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['index.js', 'lib/**/*.js'],
			all: true,
		},
		include: [
			'index.test.js',
			'lib/**/*.test.js',
		],
	},
});
