import colors from 'picocolors';

const {
	blue,
	cyan,
	green,
	yellow,
} = colors;

export const FRAMEWORKS = [
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
		name: 'vue',
		display: 'Vue',
		color: green,
		variants: [
			{
				name: 'vue-ts',
				display: 'TypeScript',
				color: blue,
			},
			{
				name: 'vue',
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
			{
				name: 'custom-react-router',
				display: 'React Router v7 ↗',
				color: cyan,
				customCommand: 'npm create react-router@latest TARGET_DIR',
			},
			{
				name: 'custom-tanstack-router-react',
				display: 'TanStack Router ↗',
				color: cyan,
				customCommand: 'npm create -- tsrouter-app@latest TARGET_DIR --framework React --interactive',
			},
		],
	},
];
