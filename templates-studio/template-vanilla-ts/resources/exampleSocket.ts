import { type IterableEventQueue, RequestTarget, Resource, tables } from 'harperdb';

interface ExampleSocketRecord {
	id: string;
	type?: 'get' | 'put';
	name: string;
	tag: string;
}

export class ExampleSocket extends Resource<ExampleSocketRecord> {
	static loadAsInstance = false;

	// This customizes handling the socket connections; tables can have this method too!
	async *connect(
		target: RequestTarget,
		incomingMessages: IterableEventQueue<ExampleSocketRecord>,
	): AsyncIterable<ExampleSocketRecord> {
		const subscription = await tables.ExamplePeople.subscribe(target);
		if (!incomingMessages) {
			// Server sent events, no incoming messages!
			// Subscribe to changes to the table.
			return subscription;
		}
		for await (let message of incomingMessages) {
			const { type, id, name, tag } = message;
			switch (type) {
				case 'get':
					const loaded = await tables.ExamplePeople.get(id);
					yield {
						type: 'get',
						id,
						...(loaded ? loaded : {}),
					};
					break;
				case 'put':
					await tables.ExamplePeople.put(id, { name, tag });
					break;
			}
		}
	}
}
