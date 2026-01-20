import { type RecordObject, type RequestTargetOrId, Resource } from 'harperdb';

/** Here we can define any JavaScript-based resources and extensions to tables
import { tables, type RequestTarget } from 'harperdb';

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
	async get(target: RequestTarget): Promise<TableNameRecord> {
		// we can modify this resource before returning
		return super.get(target);
	}
}
*/

interface GreetingRecord {
	greeting: string;
}

export class Greeting extends Resource<GreetingRecord> {
	static loadAsInstance = false;

	async post(target: RequestTargetOrId, newRecord: Partial<GreetingRecord & RecordObject>): Promise<GreetingRecord> {
		return { greeting: 'Greetings, post!' };
	}

	async get(target?: RequestTargetOrId): Promise<GreetingRecord> {
		return { greeting: 'Greetings, get!' };
	}

	async put(target: RequestTargetOrId, record: GreetingRecord & RecordObject): Promise<GreetingRecord> {
		return { greeting: 'Greetings, put!' };
	}

	async patch(target: RequestTargetOrId, record: Partial<GreetingRecord & RecordObject>): Promise<GreetingRecord> {
		return { greeting: 'Greetings, patch!' };
	}

	async delete(target: RequestTargetOrId): Promise<boolean> {
		return true;
	}
}
