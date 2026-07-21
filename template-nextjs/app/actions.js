'use server';

/* global tables */
import { revalidatePath } from 'next/cache';

// Server actions run *inside* Harper, so they read and write tables directly through the injected
// `tables` global — no separate API and no network round-trip. Harper provides `tables`, so use it
// directly; do NOT add a top-level `import 'harper'` — that import runs during the Next.js
// production build and conflicts with the running database.

// The whole counter lives in a single row keyed by 'count', so reads and writes are a cheap
// point lookup — no table scans.
export async function getCount() {
	const record = await tables.Count.get('count');
	return record?.value ?? 0;
}

export async function increment() {
	const current = await tables.Count.get('count');
	await tables.Count.put('count', { id: 'count', value: (current?.value ?? 0) + 1 });
	revalidatePath('/');
}
