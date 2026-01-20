/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_EXAMPLE_ENV_VAR: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
