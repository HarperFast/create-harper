import colors from 'picocolors';

const {
	cyan,
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

All options are optional:
  -t, --template NAME                   use a specific template
  -i, --immediate                       install dependencies and start dev
  --interactive / --no-interactive      force interactive / non-interactive mode
  --version                             print out the version of the create-harper templates
  --overwrite                           if a directory already exists, clear it out before applying the new template

If you are going to deploy your application to https://fabric.harper.fast/, you can choose to specify your:
  --deploymentURL                       The https://fabric.harper.fast/ URL where you will host your application
  --deploymentUsername                  The cluster username in https://fabric.harper.fast/ for your application

Available templates:
${yellow('vanilla-ts          vanilla')}
${cyan('react-ts            react')}`;
