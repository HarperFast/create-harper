import colors from 'picocolors';
import { templates } from './templates.js';

const {
	blue,
	cyan,
	green,
	magenta,
	yellow,
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

/** Display name and color for each framework family. */
const frameworkMeta = {
	vanilla: { display: 'Vanilla', color: yellow },
	react: { display: 'React', color: cyan },
	vue: { display: 'Vue', color: green },
	nextjs: { display: 'Next.js', color: magenta },
};

/**
 * The list of supported frameworks and their variants, derived from the template catalog so the
 * interactive picker stays in sync with the single source of truth.
 * @type {Framework[]}
 */
export const frameworks = (() => {
	/** @type {Framework[]} */
	const grouped = [];
	const byName = new Map();

	for (const t of templates) {
		let framework = byName.get(t.framework);
		if (!framework) {
			const meta = frameworkMeta[t.framework];
			if (!meta) {
				throw new Error(
					`Missing framework metadata for "${t.framework}". Please add it to frameworkMeta in frameworks.js.`,
				);
			}
			framework = {
				name: t.framework,
				display: meta.display,
				color: meta.color,
				variants: [],
			};
			byName.set(t.framework, framework);
			grouped.push(framework);
		}
		framework.variants.push({
			name: t.name,
			display: `${t.typescript ? 'TypeScript' : 'JavaScript'}${t.ssr ? ' + SSR' : ''}`,
			color: t.typescript ? blue : yellow,
		});
	}

	return grouped;
})();
