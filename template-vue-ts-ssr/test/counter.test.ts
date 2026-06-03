import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { decrement, increment } from '../src/counter.ts';

test('increment function', () => {
	strictEqual(increment(0), 1);
	strictEqual(increment(1), 2);
	strictEqual(increment(-1), 0);
});

test('decrement function', () => {
	strictEqual(decrement(0), -1);
	strictEqual(decrement(1), 0);
	strictEqual(decrement(-1), -2);
});
