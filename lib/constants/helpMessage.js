import colors from 'picocolors';

const {
	cyan,
	green,
	yellow,
} = colors;

/**
 * The help message displayed when using the --help flag or on invalid input.
 * @type {string}
 */
export const helpMessage = `\
Usage: create-harper [OPTION]... [DIRECTORY]

Create a new Harper project in JavaScript or TypeScript.
When running in TTY, the CLI will start in interactive mode.

Options:
  -t, --template NAME                   use a specific template
  -i, --immediate                       install dependencies and start dev
  --interactive / --no-interactive      force interactive / non-interactive mode
  --version                             print out the version of the create-harper templates

Available templates:
${yellow('vanilla-ts          vanilla')}
${green('vue-ts              vue')}
${cyan('react-ts            react')}`;
