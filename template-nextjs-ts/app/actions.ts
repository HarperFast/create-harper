'use server';

import type { DogRecord } from '@/harper';
import { revalidatePath } from 'next/cache';

// Server actions run *inside* Harper, so they read and write tables directly through the `tables`
// global — no network round-trip to a separate API. Harper injects `tables` into server-side code,
// so use it directly; do NOT add a top-level `import 'harper'` — that import runs during the
// Next.js production build and conflicts with the running database. Because these are server
// actions, both server and client components can call them.

export async function listDogs(): Promise<DogRecord[]> {
	const dogs: DogRecord[] = [];
	for await (const dog of tables.Dog.search()) {
		dogs.push({ id: dog.id, name: dog.name, breed: dog.breed, age: dog.age, color: dog.color });
	}
	return dogs;
}

export async function getDog(id: string): Promise<DogRecord | undefined> {
	return tables.Dog.get(id);
}

export async function createDog(formData: FormData): Promise<void> {
	const name = formData.get('name');
	const breed = formData.get('breed');
	const age = formData.get('age');
	const color = formData.get('color');

	// Check the raw values so a valid age of 0 (a puppy!) isn't rejected as "missing".
	if (!name || !breed || !age || !color) {
		throw new Error('All fields are required');
	}

	await tables.Dog.create({
		name: String(name),
		breed: String(breed),
		age: Number(age),
		color: String(color),
	});
	revalidatePath('/dogs');
}

export async function deleteDog(id: string): Promise<void> {
	await tables.Dog.delete(id);
	revalidatePath('/dogs');
}
