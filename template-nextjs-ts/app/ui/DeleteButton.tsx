'use client';

import { useTransition } from 'react';
import { deleteDog } from '../actions';

export default function DeleteButton({ dogId }: { dogId: string }) {
	// useTransition keeps the UI responsive during the server action, shows a pending state, and
	// prevents double-submits — the recommended pattern for calling server actions from the client.
	const [isPending, startTransition] = useTransition();

	return (
		<button
			onClick={() => startTransition(() => deleteDog(dogId))}
			disabled={isPending}
			style={{
				backgroundColor: '#ef4444',
				color: 'white',
				padding: '0.25rem 0.75rem',
				border: 'none',
				borderRadius: '4px',
				fontSize: '0.875rem',
				cursor: isPending ? 'not-allowed' : 'pointer',
				opacity: isPending ? 0.6 : 1,
			}}
		>
			{isPending ? 'Deleting…' : 'Delete'}
		</button>
	);
}
