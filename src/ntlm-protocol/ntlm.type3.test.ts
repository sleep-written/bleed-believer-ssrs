import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { buildType3 } from './ntlm.type3.js';

const credentials = { username: 'User', password: 'Password', domain: 'Domain' };
const type2 = {
    flags: 0x00088205,
    serverChallenge: Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]),
    targetInfo: Buffer.from([0x00, 0x00, 0x00, 0x00]),
};

describe('buildType3', () => {
    it('should have NTLMSSP signature', () => {
        const msg = buildType3(credentials, type2);
        strictEqual(msg.toString('ascii', 0, 7), 'NTLMSSP');
        strictEqual(msg[7], 0);
    });

    it('should have MessageType = 3', () => {
        strictEqual(buildType3(credentials, type2).readUInt32LE(8), 3);
    });

    it('should have non-zero NT response length', () => {
        const msg = buildType3(credentials, type2);
        ok(msg.readUInt16LE(20) > 0);
    });

    it('should encode username in payload', () => {
        const msg = buildType3(credentials, type2);
        const userLen = msg.readUInt16LE(36);
        const userOff = msg.readUInt32LE(40);
        const userStr = msg.subarray(userOff, userOff + userLen).toString('utf16le');
        strictEqual(userStr, 'User');
    });

    it('should encode domain in payload', () => {
        const msg = buildType3(credentials, type2);
        const domainLen = msg.readUInt16LE(28);
        const domainOff = msg.readUInt32LE(32);
        const domainStr = msg.subarray(domainOff, domainOff + domainLen).toString('utf16le');
        strictEqual(domainStr, 'Domain');
    });

    it('should use the MsvAvTimestamp from target info in the blob', () => {
        const ts = Buffer.from([0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80]);
        const targetInfo = Buffer.concat([
            Buffer.from([0x07, 0x00, 0x08, 0x00]),
            ts,
            Buffer.alloc(4),
        ]);

        const msg = buildType3(credentials, { ...type2, targetInfo });
        const ntOff = msg.readUInt32LE(24);
        const blobTimestamp = Buffer.from(msg.subarray(ntOff + 24, ntOff + 32));
        deepStrictEqual(blobTimestamp, ts);
    });
});
