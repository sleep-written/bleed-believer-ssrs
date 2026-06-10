import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';

import { md4 } from './ntlm.md4.js';

describe('md4', () => {
    it('should hash empty string', () => {
        strictEqual(md4(Buffer.alloc(0)).toString('hex'), '31d6cfe0d16ae931b73c59d7e0c089c0');
    });

    it('should hash "a"', () => {
        strictEqual(md4(Buffer.from('a')).toString('hex'), 'bde52cb31de33e46245e05fbdbd6fb24');
    });

    it('should hash "abc"', () => {
        strictEqual(md4(Buffer.from('abc')).toString('hex'), 'a448017aaf21d8525fc10ae87aa6729d');
    });

    it('should hash "message digest"', () => {
        strictEqual(md4(Buffer.from('message digest')).toString('hex'), 'd9130a8164549fe818874806e1c7014b');
    });
});
