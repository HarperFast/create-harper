import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decrement, increment } from '../web/counter.js';

test('increment function', () => {
	assert.strictEqual(increment(0), 1);
	assert.strictEqual(increment(1), 2);
	assert.strictEqual(increment(-1), 0);
});

test('decrement function', () => {
	assert.strictEqual(decrement(0), -1);
	assert.strictEqual(decrement(1), 0);
	assert.strictEqual(decrement(-1), -2);
});
