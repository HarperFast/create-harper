import { Resource } from 'harperdb';

export class Greeting extends Resource {
	// a "Hello, world!" handler
	static loadAsInstance = false; // use the updated/newer Resource API

	get() {
		return { greeting: 'Hello, world!' };
	}
}
