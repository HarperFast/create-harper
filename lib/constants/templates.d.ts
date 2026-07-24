export type Framework = 'vanilla' | 'react' | 'vue' | 'nextjs';

export type TemplateName =
	| 'vanilla-ts'
	| 'vanilla'
	| 'react-ts'
	| 'react'
	| 'react-ts-ssr'
	| 'react-ssr'
	| 'vue-ts'
	| 'vue'
	| 'vue-ts-ssr'
	| 'vue-ssr'
	| 'nextjs-ts'
	| 'nextjs';

export interface TemplateInfo {
	/** The canonical template name (e.g. 'vanilla', 'react-ts'). Used to scaffold. */
	name: TemplateName;
	/** The framework family this template belongs to. */
	framework: Framework;
	/** A human-friendly display title. */
	title: string;
	/** A short description of the template. */
	description: string;
	/** Tags describing the template's stack. */
	tags: string[];
	/** Whether the template uses TypeScript. */
	typescript: boolean;
	/** Whether the template is server-side rendered. */
	ssr: boolean;
	/**
	 * Whether a Studio template package is built and published for this template. Defaults to true;
	 * set to false for templates that don't (yet) run in the Studio's deploy-only model.
	 */
	studio?: boolean;
	/** The published Studio template package for this template. */
	npmPackage: string;
	/** A link to the template's source on GitHub. */
	githubUrl: string;
}

/** The catalog of every template create-harper can scaffold, in display order. */
export declare const templates: readonly TemplateInfo[];

/**
 * The flat list of every template name, in catalog order, typed as a non-empty tuple of string
 * literals so it can be passed straight to `z.enum(...)` and yield a literal union.
 */
export declare const templateNames: readonly [
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
];

/**
 * The subset of {@link templateNames} for which a Studio template package is built and published
 * (every template whose catalog entry does not set `studio: false`). Consumed by the Studio
 * build/publish scripts.
 */
export declare const studioTemplateNames: readonly TemplateName[];
