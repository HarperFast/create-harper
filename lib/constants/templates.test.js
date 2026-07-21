import colors from 'picocolors';
import { describe, expect, test } from 'vitest';
import { frameworks } from './frameworks.js';
import { templateNames, templates as catalog } from './templates.js';

const { blue, cyan, green, magenta, yellow } = colors;

describe('templates catalog', () => {
	test('templateNames is the exact, ordered list of names (keeps templates.d.ts honest)', () => {
		expect(templateNames).toEqual([
			'vanilla-ts',
			'vanilla',
			'react-ts',
			'react',
			'react-ts-ssr',
			'react-ssr',
			'vue-ts',
			'vue',
			'vue-ts-ssr',
			'vue-ssr',
			'nextjs-ts',
			'nextjs',
		]);
	});

	test('every catalog entry has a name matching templateNames', () => {
		expect(catalog.map((t) => t.name)).toEqual(templateNames);
	});

	test('npmPackage and githubUrl are derived from the template name', () => {
		for (const t of catalog) {
			expect(t.npmPackage).toBe(`@harperfast/template-${t.name}-studio`);
			expect(t.githubUrl).toBe(`https://github.com/HarperFast/create-harper/tree/main/template-${t.name}`);
		}
	});

	test('typescript and ssr flags match the template name suffixes', () => {
		for (const t of catalog) {
			expect(t.typescript).toBe(t.name.includes('-ts'));
			expect(t.ssr).toBe(t.name.endsWith('-ssr'));
		}
	});
});

describe('frameworks (derived from the catalog)', () => {
	test('groups templates by framework in catalog order', () => {
		expect(frameworks.map((f) => f.name)).toEqual(['vanilla', 'react', 'vue', 'nextjs']);
	});

	test('matches the expected display names and colors', () => {
		expect(frameworks).toEqual([
			{
				name: 'vanilla',
				display: 'Vanilla',
				color: yellow,
				variants: [
					{ name: 'vanilla-ts', display: 'TypeScript', color: blue },
					{ name: 'vanilla', display: 'JavaScript', color: yellow },
				],
			},
			{
				name: 'react',
				display: 'React',
				color: cyan,
				variants: [
					{ name: 'react-ts', display: 'TypeScript', color: blue },
					{ name: 'react', display: 'JavaScript', color: yellow },
					{ name: 'react-ts-ssr', display: 'TypeScript + SSR', color: blue },
					{ name: 'react-ssr', display: 'JavaScript + SSR', color: yellow },
				],
			},
			{
				name: 'vue',
				display: 'Vue',
				color: green,
				variants: [
					{ name: 'vue-ts', display: 'TypeScript', color: blue },
					{ name: 'vue', display: 'JavaScript', color: yellow },
					{ name: 'vue-ts-ssr', display: 'TypeScript + SSR', color: blue },
					{ name: 'vue-ssr', display: 'JavaScript + SSR', color: yellow },
				],
			},
			{
				name: 'nextjs',
				display: 'Next.js',
				color: magenta,
				variants: [
					{ name: 'nextjs-ts', display: 'TypeScript', color: blue },
					{ name: 'nextjs', display: 'JavaScript', color: yellow },
				],
			},
		]);
	});
});
