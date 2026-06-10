import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { findAvTimestamp } from './ntlm.av-timestamp.js';

function avPair(id: number, value: Buffer): Buffer {
    const head = Buffer.alloc(4);
    head.writeUInt16LE(id, 0);
    head.writeUInt16LE(value.length, 2);
    return Buffer.concat([ head, value ]);
}

const EOL = avPair(0, Buffer.alloc(0));

describe('findAvTimestamp', () => {
    it('should find the MsvAvTimestamp pair', () => {
        const ts = Buffer.from([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
        const info = Buffer.concat([
            avPair(2, Buffer.from('AB', 'utf16le')),
            avPair(7, ts),
            EOL,
        ]);

        deepStrictEqual(findAvTimestamp(info), ts);
    });

    it('should return null when the timestamp pair is absent', () => {
        const info = Buffer.concat([
            avPair(2, Buffer.from('AB', 'utf16le')),
            EOL,
        ]);

        strictEqual(findAvTimestamp(info), null);
    });

    it('should return null for an empty buffer', () => {
        strictEqual(findAvTimestamp(Buffer.alloc(0)), null);
    });

    it('should ignore truncated pairs', () => {
        const head = Buffer.alloc(4);
        head.writeUInt16LE(7, 0);
        head.writeUInt16LE(50, 2);
        strictEqual(findAvTimestamp(head), null);
    });

    it('should ignore timestamps with an invalid length', () => {
        const info = Buffer.concat([
            avPair(7, Buffer.from([ 1, 2, 3, 4 ])),
            EOL,
        ]);

        strictEqual(findAvTimestamp(info), null);
    });
});
