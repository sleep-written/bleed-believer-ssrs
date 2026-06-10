import { deepStrictEqual, strictEqual, throws } from 'node:assert';
import { describe, it } from 'node:test';

import { normalizeBody } from './ntlm.normalize-body.js';

describe('normalizeBody', () => {
    it('should return undefined for null or undefined', () => {
        strictEqual(normalizeBody(null), undefined);
        strictEqual(normalizeBody(undefined), undefined);
    });

    it('should encode strings as UTF-8', () => {
        deepStrictEqual(normalizeBody('hola'), Buffer.from('hola'));
    });

    it('should accept Buffer and TypedArray views', () => {
        deepStrictEqual(normalizeBody(Buffer.from([ 1, 2 ])), Buffer.from([ 1, 2 ]));
        deepStrictEqual(normalizeBody(new Uint8Array([ 3, 4 ])), Buffer.from([ 3, 4 ]));
    });

    it('should accept ArrayBuffer', () => {
        deepStrictEqual(normalizeBody(new Uint8Array([ 5 ]).buffer), Buffer.from([ 5 ]));
    });

    it('should serialize URLSearchParams', () => {
        deepStrictEqual(normalizeBody(new URLSearchParams({ a: '1' })), Buffer.from('a=1'));
    });

    it('should throw on unsupported body types', () => {
        throws(() => normalizeBody(new FormData()), /unsupported body type/);
    });
});
