import { type RecordObject, type RequestTargetOrId, Resource } from 'harperdb';

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
