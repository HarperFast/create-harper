import { frameworks } from './frameworks.js';

/**
 * A list of all available template names derived from the frameworks and their variants.
 * @type {string[]}
 */
export const templates = frameworks.map((f) => f.variants.map((v) => v.name)).reduce(
	(a, b) => a.concat(b),
	[],
);
