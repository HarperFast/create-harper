import { type RequestTargetOrId, tables } from 'harperdb';

interface TableNameRecord {
	id: string;
	name: string;
	tag: string;
}

export class TableName extends tables.TableName<TableNameRecord> {
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
