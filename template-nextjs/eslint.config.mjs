import next from 'eslint-config-next';

const eslintConfig = [
	...next,
	{
		// `tables` is a global injected by the Harper runtime for server-side code.
		languageOptions: {
			globals: {
				tables: 'readonly',
			},
		},
	},
	{
		ignores: ['.next/', 'node_modules/'],
	},
];

export default eslintConfig;
