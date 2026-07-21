// Ambient type declarations for the Harper runtime.
//
// Harper injects a `tables` global into server-side code, with one entry per `@table` defined in
// schema.graphql. These hand-written declarations give you type-safe access to your data. As you
// add tables and columns to the schema, mirror them here. (The `@harperfast/schema-codegen`
// component can also generate these for you — see the other create-harper templates.)

export interface CountRecord {
	id: string;
	value: number;
}

interface HarperTable<T extends { id: string }> {
	get(id: string): Promise<T | undefined>;
	put(id: string, record: T): Promise<void>;
}

declare global {
	const tables: {
		Count: HarperTable<CountRecord>;
	};
}
