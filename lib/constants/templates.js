const CREATE_HARPER_TREE = 'https://github.com/HarperFast/create-harper/tree/main';

/**
 * @typedef {'vanilla' | 'react' | 'vue'} Framework
 */

/**
 * @typedef {Object} TemplateInfo
 * @property {string} name - The canonical template name (e.g. 'vanilla', 'react-ts'). Used to scaffold.
 * @property {Framework} framework - The framework family this template belongs to.
 * @property {string} title - A human-friendly display title.
 * @property {string} description - A short description of the template.
 * @property {string[]} tags - Tags describing the template's stack.
 * @property {boolean} typescript - Whether the template uses TypeScript.
 * @property {boolean} ssr - Whether the template is server-side rendered.
 * @property {string} npmPackage - The published Studio template package for this template.
 * @property {string} githubUrl - A link to the template's source on GitHub.
 */

/**
 * Build a {@link TemplateInfo} entry, deriving the npm package and GitHub URL from the template name.
 *
 * @param {Omit<TemplateInfo, 'npmPackage' | 'githubUrl'>} info
 * @returns {TemplateInfo}
 */
function template(info) {
	return {
		...info,
		npmPackage: `@harperfast/template-${info.name}-studio`,
		githubUrl: `${CREATE_HARPER_TREE}/template-${info.name}`,
	};
}

/**
 * The catalog of every template create-harper can scaffold. This is the single source of truth from
 * which {@link templateNames} (the flat name list) and
 * {@link import('./frameworks.js').frameworks} (the interactive picker) are derived.
 *
 * Order is significant: it determines the order of the flat name list and the CLI picker.
 *
 * @type {TemplateInfo[]}
 */
export const templates = [
	template({
		name: 'vanilla-ts',
		framework: 'vanilla',
		title: 'Vanilla + TypeScript',
		description: 'The same Web + REST ORM from the first template, but with TypeScript sprinkled in.',
		tags: ['Vanilla', 'TypeScript', 'GraphQL'],
		typescript: true,
		ssr: false,
	}),
	template({
		name: 'vanilla',
		framework: 'vanilla',
		title: 'Vanilla JS',
		description: "Define your entities in schema.graphql, add your HTML/CSS/JS in web, and you're cooking!",
		tags: ['Vanilla', 'REST', 'GraphQL', 'ORM'],
		typescript: false,
		ssr: false,
	}),
	template({
		name: 'react-ts',
		framework: 'react',
		title: 'React + TypeScript',
		description: 'The same Vite-powered React app, with end-to-end type safety from TypeScript.',
		tags: ['React', 'TypeScript', 'Vite', 'SPA'],
		typescript: true,
		ssr: false,
	}),
	template({
		name: 'react',
		framework: 'react',
		title: 'React',
		description: "A Vite-powered React single-page app, wired up to Harper's REST + GraphQL APIs out of the box.",
		tags: ['React', 'Vite', 'SPA', 'GraphQL'],
		typescript: false,
		ssr: false,
	}),
	template({
		name: 'react-ts-ssr',
		framework: 'react',
		title: 'React + TypeScript + SSR',
		description: 'Server-rendered React with Vite and TypeScript for type-safe, SEO-friendly pages on Harper.',
		tags: ['React', 'TypeScript', 'SSR', 'Vite'],
		typescript: true,
		ssr: true,
	}),
	template({
		name: 'react-ssr',
		framework: 'react',
		title: 'React + SSR',
		description: 'Server-rendered React with Vite for fast first paints, hydrating into a full SPA on Harper.',
		tags: ['React', 'SSR', 'Vite', 'GraphQL'],
		typescript: false,
		ssr: true,
	}),
	template({
		name: 'vue-ts',
		framework: 'vue',
		title: 'Vue + TypeScript',
		description: 'The same Vite-powered Vue app, with end-to-end type safety from TypeScript.',
		tags: ['Vue', 'TypeScript', 'Vite', 'SPA'],
		typescript: true,
		ssr: false,
	}),
	template({
		name: 'vue',
		framework: 'vue',
		title: 'Vue',
		description: "A Vite-powered Vue single-page app, wired up to Harper's REST + GraphQL APIs out of the box.",
		tags: ['Vue', 'Vite', 'SPA', 'GraphQL'],
		typescript: false,
		ssr: false,
	}),
	template({
		name: 'vue-ts-ssr',
		framework: 'vue',
		title: 'Vue + TypeScript + SSR',
		description: 'Server-rendered Vue with Vite and TypeScript for type-safe, SEO-friendly pages on Harper.',
		tags: ['Vue', 'TypeScript', 'SSR', 'Vite'],
		typescript: true,
		ssr: true,
	}),
	template({
		name: 'vue-ssr',
		framework: 'vue',
		title: 'Vue + SSR',
		description: 'Server-rendered Vue with Vite for fast first paints, hydrating into a full SPA on Harper.',
		tags: ['Vue', 'SSR', 'Vite', 'GraphQL'],
		typescript: false,
		ssr: true,
	}),
];

/**
 * The flat list of every template name, in catalog order. This is the canonical, dependency-free list
 * other tools can import to validate or enumerate templates.
 *
 * @type {string[]}
 */
export const templateNames = templates.map((t) => t.name);
