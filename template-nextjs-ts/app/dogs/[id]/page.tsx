import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDog } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	// In the App Router, `params` is a promise — await it before reading route values.
	const { id } = await params;
	const dog = await getDog(id);

	if (!dog) {
		notFound();
	}

	return (
		<div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
			<Link href="/dogs" style={{ color: '#403b8a', textDecoration: 'none', fontSize: '0.875rem' }}>
				← Back to all dogs
			</Link>
			<div
				style={{
					backgroundColor: 'white',
					padding: '2rem',
					borderRadius: '8px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					border: '1px solid #e5e7eb',
				}}
			>
				<h1 style={{ margin: '0 0 1rem', fontSize: '2rem', fontWeight: '700', color: '#1e293b' }}>
					{dog.name}
				</h1>
				<dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.5rem 1.5rem', margin: 0 }}>
					<dt style={{ fontWeight: '600', color: '#374151' }}>Breed</dt>
					<dd style={{ margin: 0, color: '#64748b' }}>{dog.breed}</dd>
					<dt style={{ fontWeight: '600', color: '#374151' }}>Age</dt>
					<dd style={{ margin: 0, color: '#64748b' }}>{dog.age} years</dd>
					<dt style={{ fontWeight: '600', color: '#374151' }}>Color</dt>
					<dd style={{ margin: 0, color: '#64748b' }}>{dog.color}</dd>
				</dl>
			</div>
		</div>
	);
}
