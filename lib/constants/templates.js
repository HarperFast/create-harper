import { FRAMEWORKS } from './frameworks.js';

export const TEMPLATES = FRAMEWORKS.map((f) => f.variants.map((v) => v.name)).reduce(
	(a, b) => a.concat(b),
	[],
);
