import { App } from '@/App.tsx';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import './style.css';

// Hydrate the server-rendered markup. (A client-only app would use `createRoot(...).render(...)`.)
hydrateRoot(
	document.getElementById('app')!,
	<StrictMode>
		<App />
	</StrictMode>,
);
