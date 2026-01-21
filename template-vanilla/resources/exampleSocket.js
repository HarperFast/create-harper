import { Resource, tables } from 'harperdb';

export class ExampleSocket extends Resource {
	static loadAsInstance = false;

	// This customizes handling the socket connections; tables can have this method too!
	async *connect(
		target,
		incomingMessages,
	) {
		const subscription = await tables.ExampleTable.subscribe(target);
		if (!incomingMessages) {
			// Server sent events, no incoming messages!
			// Subscribe to changes to the table.
			return subscription;
		}
		for await (let message of incomingMessages) {
			const { type, id, name, tag } = message;
			switch (type) {
				case 'get':
					const loaded = await tables.ExampleTable.get(id);
					yield {
						type: 'get',
						id,
						...(loaded ? loaded : {}),
					};
					break;
				case 'put':
					await tables.ExampleTable.put(id, { name, tag });
					break;
			}
		}
	}
}
