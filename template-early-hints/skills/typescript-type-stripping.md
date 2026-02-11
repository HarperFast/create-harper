# TypeScript Type Stripping

Harper supports using TypeScript directly without any additional build tools (like `tsc` or `esbuild`) by leveraging Node.js's native Type Stripping capability. This allows you to write `.ts` files for your Custom Resources and have them run directly in Harper.

## Requirements

- **Node.js Version**: You must be running a version of Node.js that supports type stripping (Node.js v22.6.0 or higher).
- **No Experimental Flags**: When running on supported Node.js versions, Harper can automatically handle type stripping for your resource files.

## Benefits

- **Faster Development**: No need to wait for a build step or manage complex build pipelines.
- **Simplified Tooling**: You don't need to install or configure `ts-node`, `tsx`, or other TypeScript execution engines for your Harper resources.
- **Native Performance**: Leverages Node.js's built-in support for stripping types, which is highly efficient.

## Usage

Simply name your resource files with a `.ts` extension in your `resources/` directory.

### Example: `resources/my-resource.ts`

```typescript
import { Resource } from 'harperdb';

export class MyResource extends Resource {
	async get() {
		return { message: 'This is running directly from TypeScript!' };
	}
}
```

When cross-referencing between modules, ensure that the file path contains the appropriate extension.

```typescript
import { MyResource } from './my-resource.ts';
```

## Configuration

In your `config.yaml`, ensure your `jsResource` points to your `.ts` files:

```yaml
jsResource:
  files: 'resources/*.ts'
```

When Harper starts, it will detect the `.ts` files and, if running on a compatible Node.js version, will execute them using type stripping.
