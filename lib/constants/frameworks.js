import colors from 'picocolors';

const {
	blue,
	cyan,
	gray,
	yellow,
} = colors;

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
		name: 'studio',
		hidden: true,
		display: 'Studio',
		color: gray,
		variants: [
			{
				name: 'studio-ts',
				display: 'TypeScript',
				color: gray,
			},
			{
				name: 'studio',
				display: 'JavaScript',
				color: gray,
			},
		],
	},
];
