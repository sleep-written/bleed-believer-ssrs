import type { NTLMType2Data } from './interfaces/ntlm.type2-data.js';

const NTLM_SIGNATURE = 'NTLMSSP\0';
const MIN_LENGTH = 32;
const TARGET_INFO_FIELDS_END = 48;

export function parseType2(buf: Buffer): NTLMType2Data {
    if (buf.length < MIN_LENGTH) {
        throw new Error(`NTLM Type 2 message too short (${buf.length} bytes, expected at least ${MIN_LENGTH})`);
    }
    if (buf.toString('ascii', 0, 8) !== NTLM_SIGNATURE) {
        throw new Error('Invalid NTLM signature');
    }
    if (buf.readUInt32LE(8) !== 2) {
        throw new Error('Expected NTLM Type 2 message');
    }

    const flags = buf.readUInt32LE(20);
    const serverChallenge = Buffer.from(buf.subarray(24, 32));

    let targetInfo = Buffer.alloc(0);
    if (buf.length >= TARGET_INFO_FIELDS_END) {
        const targetInfoLen = buf.readUInt16LE(40);
        const targetInfoOffset = buf.readUInt32LE(44);
        if (targetInfoLen > 0) {
            if (targetInfoOffset + targetInfoLen > buf.length) {
                throw new Error('NTLM Type 2 target info exceeds message bounds');
            }

            targetInfo = Buffer.from(buf.subarray(targetInfoOffset, targetInfoOffset + targetInfoLen));
        }
    }

    return { flags, serverChallenge, targetInfo };
}
