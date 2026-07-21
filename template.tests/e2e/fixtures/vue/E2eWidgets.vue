<!--
  A Vue component that fetches the exported E2eWidget table over Harper's auto-REST API and
  renders the rows. Copied into the app under test as src/E2eWidgets.vue and mounted by an
  overlay appended to the app's entry (see template.tests/e2e/overlay.js). The browser spec
  asserts the seeded record shows up in the DOM — proving a real component can read the API.
-->
<script setup>
import { onMounted, ref } from "vue";

const items = ref([]);
const error = ref(null);

onMounted(async () => {
	try {
		const response = await fetch("/E2eWidget/", { headers: { Accept: "application/json" } });
		const data = await response.json();
		items.value = Array.isArray(data) ? data : [];
	} catch (cause) {
		error.value = String(cause);
	}
});
</script>

<template>
	<section data-testid="e2e-widgets">
		<h2>E2E Widgets</h2>
		<p v-if="error" data-testid="e2e-error">{{ error }}</p>
		<ul data-testid="e2e-widget-list">
			<li v-for="widget in items" :key="widget.id" data-testid="e2e-widget-item">
				{{ widget.name }}
			</li>
		</ul>
	</section>
</template>
