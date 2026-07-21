'use server';

/* global tables */
import 'harper';
import { revalidatePath } from 'next/cache';

// Server actions run *inside* Harper, so they read and write tables directly through the `tables`
// global — no network round-trip to a separate API. Importing 'harper' makes the runtime globals
// available. Because these are server actions, both server and client components can call them.

export async function listDogs() {
	const dogs = [];
	for await (const dog of tables.Dog.search()) {
		dogs.push({ id: dog.id, name: dog.name, breed: dog.breed, age: dog.age, color: dog.color });
	}
	return dogs;
}

export async function getDog(id) {
	return tables.Dog.get(id);
}

export async function createDog(formData) {
	const name = formData.get('name');
	const breed = formData.get('breed');
	const age = Number(formData.get('age'));
	const color = formData.get('color');

	if (!name || !breed || !age || !color) {
		throw new Error('All fields are required');
	}

	await tables.Dog.create({ name, breed, age, color });
	revalidatePath('/dogs');
}

export async function deleteDog(id) {
	await tables.Dog.delete(id);
	revalidatePath('/dogs');
}
