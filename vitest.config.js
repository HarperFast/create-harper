import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['index.js', 'lib/**/*.js'],
			exclude: ['lib/**/*.test.js'],
			all: true,
		},
	},
});
