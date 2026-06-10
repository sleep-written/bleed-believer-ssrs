import { deepStrictEqual, strictEqual, throws } from 'node:assert';
import { describe, it } from 'node:test';

import { parseType2 } from './ntlm.type2.js';

function makeType2Buffer(serverChallenge: Buffer, targetInfo: Buffer, flags: number): Buffer {
    const targetInfoOffset = 48;
    const buf = Buffer.alloc(targetInfoOffset + targetInfo.length);
    Buffer.from('NTLMSSP\0').copy(buf, 0);
    buf.writeUInt32LE(2, 8);
    buf.writeUInt16LE(0, 12);
    buf.writeUInt16LE(0, 14);
    buf.writeUInt32LE(targetInfoOffset, 16);
    buf.writeUInt32LE(flags, 20);
    serverChallenge.copy(buf, 24);
    buf.writeUInt16LE(targetInfo.length, 40);
    buf.writeUInt16LE(targetInfo.length, 42);
    buf.writeUInt32LE(targetInfoOffset, 44);
    targetInfo.copy(buf, targetInfoOffset);
    return buf;
}

describe('parseType2', () => {
    const challenge = Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]);
    const info = Buffer.from([0x02, 0x00, 0x08, 0x00, 0x41, 0x00, 0x42, 0x00]);
    const flags = 0x00088205;

    it('should parse server challenge', () => {
        const buf = makeType2Buffer(challenge, info, flags);
        deepStrictEqual(parseType2(buf).serverChallenge, challenge);
    });

    it('should parse target info', () => {
        const buf = makeType2Buffer(challenge, info, flags);
        deepStrictEqual(parseType2(buf).targetInfo, info);
    });

    it('should parse flags', () => {
        const buf = makeType2Buffer(challenge, info, flags);
        strictEqual(parseType2(buf).flags, flags);
    });

    it('should throw on invalid signature', () => {
        const bad = Buffer.from('BAD_DATA_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
        throws(() => parseType2(bad), /Invalid NTLM signature/);
    });

    it('should throw if MessageType is not 2', () => {
        const buf = makeType2Buffer(challenge, info, flags);
        buf.writeUInt32LE(1, 8);
        throws(() => parseType2(buf), /Expected NTLM Type 2 message/);
    });

    it('should throw a clear error on truncated messages', () => {
        const buf = makeType2Buffer(challenge, info, flags).subarray(0, 16);
        throws(() => parseType2(Buffer.from(buf)), /too short/);
    });

    it('should accept a minimal 32-byte message without target info', () => {
        const buf = Buffer.alloc(32);
        Buffer.from('NTLMSSP\0').copy(buf, 0);
        buf.writeUInt32LE(2, 8);
        buf.writeUInt32LE(flags, 20);
        challenge.copy(buf, 24);

        const data = parseType2(buf);
        deepStrictEqual(data.serverChallenge, challenge);
        strictEqual(data.targetInfo.length, 0);
    });

    it('should throw when target info exceeds message bounds', () => {
        const buf = makeType2Buffer(challenge, info, flags);
        buf.writeUInt16LE(500, 40);
        throws(() => parseType2(buf), /exceeds message bounds/);
    });
});
