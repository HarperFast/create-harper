// Ambient type declarations for the Harper runtime.
//
// Harper injects globals into server-side code: `tables` (one entry per `@table` in schema.graphql)
// and `transaction` (runs a callback in a committing transaction). These hand-written declarations
// give you type-safe access. As you add tables and columns, mirror them here. (The
// `@harperfast/schema-codegen` component can also generate the table types for you.)

export interface CountRecord {
	id: string;
	value: number;
}

/** An updatable record from `tables.<Table>.update(id)`, mutated inside a `transaction(...)`. */
interface UpdatableRecord<T> {
	addTo(property: keyof T, value: number): void;
	subtractFrom(property: keyof T, value: number): void;
}

interface HarperTable<T extends { id: string }> {
	get(id: string): Promise<T | undefined>;
	update(id: string): Promise<UpdatableRecord<T>>;
}

declare global {
	const tables: {
		Count: HarperTable<CountRecord>;
	};
	/** Run `callback` in a Harper transaction, committing its writes when it resolves. */
	function transaction<T>(callback: () => T | Promise<T>): Promise<T>;
}
