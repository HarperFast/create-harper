import Link from 'next/link';
import type { CSSProperties } from 'react';
import { createDog, listDogs } from '../actions';
import DeleteButton from '../ui/DeleteButton';

// Read fresh data on every request instead of caching at build time.
export const dynamic = 'force-dynamic';

const inputStyle: CSSProperties = {
	width: '100%',
	padding: '0.75rem',
	border: '1px solid #d1d5db',
	borderRadius: '4px',
	fontSize: '1rem',
	boxSizing: 'border-box',
};

const labelStyle: CSSProperties = {
	display: 'block',
	marginBottom: '0.5rem',
	fontSize: '0.875rem',
	fontWeight: '500',
	color: '#374151',
};

const cellHeader: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
	gap: '1rem',
	padding: '1rem 0',
	alignItems: 'center',
};

export default async function Page() {
	const dogs = await listDogs();

	return (
		<div style={{ display: 'flex', flexDirection: 'column', padding: '2rem', gap: '2rem' }}>
			{/* Add-a-dog form. Submitting calls the `createDog` server action directly. */}
			<div
				style={{
					backgroundColor: 'white',
					padding: '2rem',
					borderRadius: '8px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					border: '1px solid #e5e7eb',
				}}
			>
				<h2 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
					Add New Dog
				</h2>
				<form
					action={createDog}
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '1rem',
						alignItems: 'end',
					}}
				>
					<div>
						<label style={labelStyle}>Name</label>
						<input type="text" name="name" style={inputStyle} placeholder="Buddy" required />
					</div>
					<div>
						<label style={labelStyle}>Breed</label>
						<input type="text" name="breed" style={inputStyle} placeholder="Dalmatian" required />
					</div>
					<div>
						<label style={labelStyle}>Age (in years)</label>
						<input type="number" name="age" style={inputStyle} placeholder="3" min="0" required />
					</div>
					<div>
						<label style={labelStyle}>Color</label>
						<input type="text" name="color" style={inputStyle} placeholder="Black and White" required />
					</div>
					<button
						type="submit"
						style={{
							backgroundColor: '#403b8a',
							color: 'white',
							padding: '0.75rem 1.5rem',
							border: 'none',
							borderRadius: '4px',
							fontSize: '1rem',
							fontWeight: '500',
							cursor: 'pointer',
						}}
					>
						Add Dog
					</button>
				</form>
			</div>

			{/* Dogs list */}
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '8px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					border: '1px solid #e5e7eb',
				}}
			>
				<div style={{ padding: '1.5rem 2rem 0', borderBottom: '1px solid #e5e7eb' }}>
					<h2 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
						Dogs ({dogs.length})
					</h2>
				</div>
				<div style={{ padding: '0 2rem 2rem' }}>
					<div
						style={{
							...cellHeader,
							borderBottom: '2px solid #e5e7eb',
							fontWeight: '600',
							color: '#374151',
							fontSize: '0.875rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						<div>Name</div>
						<div>Breed</div>
						<div>Age</div>
						<div>Color</div>
						<div>Actions</div>
					</div>
					{dogs.map((dog) => (
						<div key={dog.id} style={{ ...cellHeader, borderBottom: '1px solid #f3f4f6' }}>
							<div style={{ fontWeight: '500', color: '#1e293b' }}>
								<Link href={`/dogs/${dog.id}`} style={{ color: '#403b8a', textDecoration: 'none' }}>
									{dog.name}
								</Link>
							</div>
							<div style={{ color: '#64748b' }}>{dog.breed}</div>
							<div style={{ color: '#64748b' }}>{dog.age} years</div>
							<div style={{ color: '#64748b' }}>{dog.color}</div>
							<div>
								<DeleteButton dogId={dog.id} />
							</div>
						</div>
					))}
					{dogs.length === 0 && (
						<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
							No dogs found. Add one above!
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
