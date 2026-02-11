import colors from 'picocolors';

const {
	blue,
	cyan,
	yellow,
	magenta,
} = colors;

/**
 * @typedef {Object} Variant
 * @property {string} name - The internal name of the variant (used for template matching).
 * @property {string} display - The display name of the variant.
 * @property {(str: string | number) => string} color - A function to color the display name.
 */

/**
 * @typedef {Object} Framework
 * @property {string} name - The internal name of the framework.
 * @property {string} display - The display name of the framework.
 * @property {(str: string | number) => string} color - A function to color the display name.
 * @property {Variant[]} variants - The available variants for this framework.
 */

/**
 * The list of supported frameworks and their variants.
 * @type {Framework[]}
 */
export const frameworks = [
	{
		name: 'vanilla',
		display: 'Vanilla',
		color: yellow,
		variants: [
			{
				name: 'vanilla-ts',
				display: 'TypeScript',
				color: blue,
			},
			{
				name: 'vanilla',
				display: 'JavaScript',
				color: yellow,
			},
		],
	},
	{
		name: 'react',
		display: 'React',
		color: cyan,
		variants: [
			{
				name: 'react-ts',
				display: 'TypeScript',
				color: blue,
			},
			{
				name: 'react',
				display: 'JavaScript',
				color: yellow,
			},
		],
	},
	{
		name: 'early-hints',
		display: 'Early Hints',
		color: magenta,
		variants: [
			{
				name: 'early-hints',
				display: 'Early Hints',
				color: blue,
			},
		],
	},
];
