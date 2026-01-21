import { frameworks } from './frameworks.js';

export const templates = frameworks.map((f) => f.variants.map((v) => v.name)).reduce(
	(a, b) => a.concat(b),
	[],
);
