import { type RequestTargetOrId, tables } from 'harperdb';

export interface TableNameRecord {
	id: string;
	name: string;
	tag: string;
}

export class ExampleTable extends tables.ExampleTable<TableNameRecord> {
	// we can define our own custom POST handler
	async post(target: RequestTargetOrId, newRecord: Omit<TableNameRecord, 'id'>) {
		// do something with the incoming content;
		return super.post(target, newRecord);
	}
	// or custom GET handler
	async get(target: RequestTargetOrId): Promise<TableNameRecord> {
		// we can modify this resource before returning
		return super.get(target);
	}
}
