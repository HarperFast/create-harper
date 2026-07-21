/**
 * A React component that fetches the exported E2eWidget table over Harper's auto-REST API and
 * renders the rows. Copied into the app under test as src/E2eWidgets.{jsx,tsx} and mounted by an
 * overlay appended to the app's entry (see template.tests/e2e/overlay.js). The browser spec
 * asserts the seeded record shows up in the DOM — proving a real component can read the API.
 *
 * Deliberately untyped so the one file is valid as both .jsx and .tsx (vite build strips types
 * without type-checking).
 */
import { useEffect, useState } from "react";

export function E2eWidgets() {
	const [items, setItems] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetch("/E2eWidget/", { headers: { Accept: "application/json" } })
			.then((response) => response.json())
			.then((data) => setItems(Array.isArray(data) ? data : []))
			.catch((cause) => setError(String(cause)));
	}, []);

	return (
		<section data-testid="e2e-widgets">
			<h2>E2E Widgets</h2>
			{error ? <p data-testid="e2e-error">{error}</p> : null}
			<ul data-testid="e2e-widget-list">
				{items.map((widget) => (
					<li key={widget.id} data-testid="e2e-widget-item">
						{widget.name}
					</li>
				))}
			</ul>
		</section>
	);
}
