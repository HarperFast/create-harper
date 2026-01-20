import colors from 'picocolors';

const {
	blue,
	cyan,
	gray,
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
		],
	},
	{
		name: 'barebones',
		display: 'Barebones',
		color: gray,
		variants: [
			{
				name: 'barebones',
				display: 'Barebones',
				color: gray,
			},
		],
	},
];
