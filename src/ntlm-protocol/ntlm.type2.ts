import type { NTLMType2Data } from './interfaces/ntlm.type2-data.js';

const NTLM_SIGNATURE = 'NTLMSSP\0';

export function parseType2(buf: Buffer): NTLMType2Data {
    if (buf.toString('ascii', 0, 8) !== NTLM_SIGNATURE) {
        throw new Error('Invalid NTLM signature');
    }
    if (buf.readUInt32LE(8) !== 2) {
        throw new Error('Expected NTLM Type 2 message');
    }

    const flags = buf.readUInt32LE(20);
    const serverChallenge = Buffer.from(buf.subarray(24, 32));

    const targetInfoLen = buf.readUInt16LE(40);
    const targetInfoOffset = buf.readUInt32LE(44);
    const targetInfo = Buffer.from(buf.subarray(targetInfoOffset, targetInfoOffset + targetInfoLen));

    return { flags, serverChallenge, targetInfo };
}
