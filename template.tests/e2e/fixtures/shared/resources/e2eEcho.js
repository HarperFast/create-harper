/**
 * A minimal custom resource, copied into the app under test as resources/e2eEcho.{js,ts}.
 * `Resource` is a Harper runtime global (no import needed), matching how the templates document
 * custom resources. The e2e suite hits GET /E2eEcho/ to prove jsResource loading + the REST
 * handler answer a custom resource with JSON.
 */
export class E2eEcho extends Resource {
	allowRead() {
		return true;
	}
	async get() {
		return { echo: 'ok' };
	}
}
