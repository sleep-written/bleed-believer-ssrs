import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { encodeUTF16LE } from './ntlm.encode-utf16le.js';

describe('encodeUTF16LE', () => {
    it('should encode ASCII string', () => {
        deepStrictEqual(
            encodeUTF16LE('abc'),
            Buffer.from([0x61, 0x00, 0x62, 0x00, 0x63, 0x00])
        );
    });

    it('should encode empty string as empty buffer', () => {
        deepStrictEqual(encodeUTF16LE(''), Buffer.alloc(0));
    });

    it('should produce double the byte length of the input', () => {
        deepStrictEqual(encodeUTF16LE('Hello').length, 10);
    });
});
