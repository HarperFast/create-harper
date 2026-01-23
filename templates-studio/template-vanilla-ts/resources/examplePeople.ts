import { type RequestTargetOrId, tables } from 'harperdb';

export interface ExamplePerson {
	id: string;
	name: string;
	tag: string;
}

export class ExamplePeople extends tables.ExamplePeople<ExamplePerson> {
	// we can define our own custom POST handler
	async post(target: RequestTargetOrId, newRecord: Omit<ExamplePerson, 'id'>) {
		// do something with the incoming content;
		return super.post(target, newRecord);
	}
	// or custom GET handler
	async get(target: RequestTargetOrId): Promise<ExamplePerson> {
		// we can modify this resource before returning
		return super.get(target);
	}
}
