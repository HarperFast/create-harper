import { decrement, increment } from './counter.js';

let count = 0;
const counterDisplay = document.getElementById('count');
const decrementButton = document.getElementById('decrement');
const incrementButton = document.getElementById('increment');

function updateDisplay() {
	counterDisplay.textContent = count;
}

decrementButton.addEventListener('click', () => {
	count = decrement(count);
	updateDisplay();
});

incrementButton.addEventListener('click', () => {
	count = increment(count);
	updateDisplay();
});
