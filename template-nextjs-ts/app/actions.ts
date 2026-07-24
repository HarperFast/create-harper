'use server';

import { revalidatePath } from 'next/cache';

// Server actions run *inside* Harper, so they read and write tables directly through the injected
// globals — no separate API and no network round-trip. Harper provides `tables` and `transaction`,
// so use them directly; do NOT add a top-level `import 'harper'` — that import runs during the
// Next.js production build and conflicts with the running database.

// The whole counter lives in a single row keyed 'count', so reads are a cheap point lookup.
export async function getCount(): Promise<number> {
	const record = await tables.Count.get('count');
	return record?.value ?? 0;
}

export async function increment(): Promise<void> {
	// Atomic increment: `addTo` inside a transaction is safe when requests overlap across worker
	// threads and replicated nodes — a read-then-write would lose concurrent increments. The
	// transaction also creates the row on first use.
	await transaction(async () => {
		const record = await tables.Count.update('count');
		record.addTo('value', 1);
	});
	revalidatePath('/');
}
