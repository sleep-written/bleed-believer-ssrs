import { ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { buildType1 } from './ntlm.type1.js';

describe('buildType1', () => {
    it('should have NTLMSSP signature', () => {
        const msg = buildType1();
        strictEqual(msg.toString('ascii', 0, 7), 'NTLMSSP');
        strictEqual(msg[7], 0);
    });

    it('should have MessageType = 1', () => {
        strictEqual(buildType1().readUInt32LE(8), 1);
    });

    it('should have NTLMSSP_NEGOTIATE_NTLM flag set', () => {
        ok(buildType1().readUInt32LE(12) & 0x00000200);
    });

    it('should be 32 bytes long', () => {
        strictEqual(buildType1().length, 32);
    });
});
