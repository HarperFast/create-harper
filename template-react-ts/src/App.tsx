import reactLogo from '/react.svg';
import typescriptLogo from '/typescript.svg';
import viteLogo from '/vite.svg';
import { useCallback, useState } from 'react';

export function App() {
	const [counter, setCounter] = useState(0);
	const countUp = useCallback(() => {
		setCounter(counter => counter + 1);
	}, []);

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">
					<img src={typescriptLogo} className="logo vanilla" alt="TypeScript logo" />
				</a>
				<a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
				<h1>Vite + TypeScript + React</h1>
				<p>Wow, look at this!</p>
				<div className="card">
					<button id="counter" type="button" onClick={countUp}>
						count is {counter}
					</button>
				</div>
			</div>
		</>
	);
}
