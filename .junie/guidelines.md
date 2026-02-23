# Project Guidelines for Junie

This project helps people make great Harper applications by providing a structured template system.

## Code Quality and Style

To ensure code quality and consistent formatting, use the following commands:

- **Linting**: Use `npm run lint:fix` to run `oxlint` and automatically fix issues.
- **Formatting**: Use `npm run format:fix` to run `dprint` and format the code.
- **Testing**: Use `npm run test` to run tests with `vitest`.

## Template Management

- **Apply Shared Templates**: Use `npm run templates:apply-shared-templates` to propagate changes from `templates-shared` to the individual template directories. This is crucial when updating common files or configurations across multiple templates.

## Harper Skills & AI Context

This project contains detailed documentation on "skills" required for developing Harper applications. If you need more information about how Harper handles specific features (e.g., schemas, authentication, custom resources), refer to the following directory:

- **Location**: `templates-shared/all/`
- **Main Entry Point**: `templates-shared/all/AGENTS.md`

This directory includes a `skills/` subdirectory with focused guides on various aspects of Harper development. Always consult these resources when modifying or creating new templates to ensure they align with Harper's best practices.
