// Ambient type declarations for the Harper runtime.
//
// Harper injects a `tables` global for server-side code, with one entry per `@table` defined in
// schema.graphql. These hand-written declarations give you type-safe access to your data. As you
// add tables and columns to the schema, mirror them here. (The `@harperfast/schema-codegen`
// component can also generate these for you — see the other create-harper templates.)

export interface DogRecord {
	id: string;
	name: string;
	breed: string;
	age: number;
	color: string;
}

interface HarperTable<T extends { id: string }> {
	get(id: string): Promise<T | undefined>;
	search(query?: unknown): AsyncIterable<T>;
	create(record: Omit<T, 'id'> & { id?: string }): Promise<T>;
	delete(id: string): Promise<void>;
}

declare global {
	const tables: {
		Dog: HarperTable<DogRecord>;
	};
}
