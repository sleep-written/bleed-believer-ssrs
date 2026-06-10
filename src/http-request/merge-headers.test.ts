import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { mergeHeaders } from './merge-headers.js';

describe('mergeHeaders', () => {
    it('should return the base headers when nothing is provided', () => {
        deepStrictEqual(mergeHeaders({ a: '1' }), { a: '1' });
    });

    it('should merge a plain object over the base', () => {
        deepStrictEqual(
            mergeHeaders({ a: '1', b: '2' }, { b: '3' }),
            { a: '1', b: '3' }
        );
    });

    it('should merge an entries array', () => {
        deepStrictEqual(
            mergeHeaders({ a: '1' }, [ [ 'b', '2' ] ]),
            { a: '1', b: '2' }
        );
    });

    it('should merge a Headers instance', () => {
        deepStrictEqual(
            mergeHeaders({ a: '1' }, new Headers({ 'x-token': 'abc' })),
            { a: '1', 'x-token': 'abc' }
        );
    });

    it('should not mutate the base object', () => {
        const base = { a: '1' };
        mergeHeaders(base, { b: '2' });
        deepStrictEqual(base, { a: '1' });
    });
});
