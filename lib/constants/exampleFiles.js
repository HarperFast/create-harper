/**
 * @typedef {Object} ExampleFile
 * @property {string} label - The display label for the example.
 * @property {string} value - The internal value for the example.
 * @property {string[]} files - The files associated with this example.
 */

/**
 * The list of available example files that can be optionally included in the project.
 * @type {ExampleFile[]}
 */
export const exampleFiles = [
	{
		label: 'Table schema',
		value: 'tableSchema',
		files: ['schemas/exampleTable.graphql'],
	},
	{
		label: 'Table handling',
		value: 'table',
		files: ['resources/exampleTable.ts', 'resources/exampleTable.js'],
	},
	{
		label: 'Resource',
		value: 'resource',
		files: ['resources/greeting.ts', 'resources/greeting.js'],
	},
	{
		label: 'Sockets',
		value: 'socket',
		files: ['resources/exampleSocket.ts', 'resources/exampleSocket.js'],
	},
];
