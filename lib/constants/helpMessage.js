import colors from 'picocolors';

const {
	cyan,
	green,
	yellow,
} = colors;

export const helpMessage = `\
Usage: create-harper [OPTION]... [DIRECTORY]

Create a new Harper project in JavaScript or TypeScript.
When running in TTY, the CLI will start in interactive mode.

Options:
  -t, --template NAME                   use a specific template
  -i, --immediate                       install dependencies and start dev
  --interactive / --no-interactive      force interactive / non-interactive mode

Available templates:
${yellow('vanilla-ts          vanilla')}
${green('vue-ts              vue')}
${cyan('react-ts            react')}`;
