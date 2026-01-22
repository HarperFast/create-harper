import { tables } from 'harperdb';

export class ExampleTable extends tables.ExampleTable {
	// we can define our own custom POST handler
	post(content) {
		// do something with the incoming content;
		return super.post(content);
	}
	// or custom GET handler
	get() {
		// we can modify this resource before returning
		return super.get();
	}
}
