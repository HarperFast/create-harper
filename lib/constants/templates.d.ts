export type Framework = 'vanilla' | 'react' | 'vue';

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
	| 'vue-ssr';

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
];
