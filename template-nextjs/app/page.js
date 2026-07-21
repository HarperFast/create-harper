import Link from 'next/link';

export default function Page() {
	return (
		<section
			style={{
				minHeight: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '3rem 0 2rem',
				textAlign: 'center',
				backgroundColor: '#f8fafc',
				flex: 1,
			}}
		>
			<h1
				style={{
					fontSize: '2.5rem',
					fontWeight: '700',
					margin: '0 0 1rem',
					color: '#1e293b',
					letterSpacing: '-0.025em',
				}}
			>
				Doggy Management System
			</h1>
			<p style={{ fontSize: '1.125rem', color: '#64748b', margin: '0 0 2rem', maxWidth: '600px' }}>
				An application for managing dog records. View, add, and organize your canine database with ease.
			</p>

			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
				<Link
					href="/dogs"
					style={{
						backgroundColor: '#403b8a',
						color: 'white',
						padding: '1rem 2rem',
						borderRadius: '8px',
						textDecoration: 'none',
						fontSize: '1.125rem',
						fontWeight: '600',
						boxShadow: '0 4px 6px rgba(64, 59, 138, 0.25)',
					}}
				>
					🐕 Manage Dogs →
				</Link>
				<p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
					Add, view, and delete dog records in real time
				</p>
			</div>
		</section>
	);
}
