import { getCount, increment } from './actions';

// Read the count fresh on every request rather than caching it at build time.
export const dynamic = 'force-dynamic';

export default async function Page() {
	const count = await getCount();

	return (
		<main
			style={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				gap: '1rem',
				padding: '2rem',
				textAlign: 'center',
			}}
		>
			<h1 style={{ margin: 0 }}>Next.js + Harper</h1>
			<p style={{ margin: 0, color: '#64748b', maxWidth: '32rem' }}>
				This counter is stored in a Harper table. Clicking the button calls a{' '}
				<a href="https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations">
					server action
				</a>{' '}
				that reads and writes the table directly — no separate API.
			</p>
			{
				/* A plain form calling a server action: no client component needed, and the browser
			    shows its own pending state while the action runs. */
			}
			<form action={increment}>
				<button
					type="submit"
					style={{
						fontSize: '1.125rem',
						padding: '0.75rem 1.5rem',
						borderRadius: '8px',
						border: '1px solid #cbd5e1',
						background: '#403b8a',
						color: 'white',
						cursor: 'pointer',
					}}
				>
					count is {count}
				</button>
			</form>
			<p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
				Edit the schema in <code>schema.graphql</code> and the logic in <code>app/actions.ts</code>.
			</p>
		</main>
	);
}
