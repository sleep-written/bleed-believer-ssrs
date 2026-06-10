import type { NTLMProtocolCredentials } from './interfaces/ntlm-protocol.credentials.js';
import type { NTLMType2Data } from './interfaces/ntlm.type2-data.js';

import { createHmac, randomBytes } from 'node:crypto';

import { encodeUTF16LE } from './ntlm.encode-utf16le.js';
import { md4 } from './ntlm.md4.js';

const SIGNATURE = Buffer.from('NTLMSSP\0');

const FLAGS =
    0x00000001 |  // NTLMSSP_NEGOTIATE_UNICODE
    0x00000004 |  // NTLMSSP_REQUEST_TARGET
    0x00000200 |  // NTLMSSP_NEGOTIATE_NTLM
    0x00008000 |  // NTLMSSP_NEGOTIATE_ALWAYS_SIGN
    0x00080000;   // NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY

const EPOCH_DIFF_MS = 11644473600000n;

function writeFields(msg: Buffer, offset: number, len: number, dataOffset: number): void {
    msg.writeUInt16LE(len, offset);
    msg.writeUInt16LE(len, offset + 2);
    msg.writeUInt32LE(dataOffset, offset + 4);
}

export function buildType3(credentials: NTLMProtocolCredentials, type2: NTLMType2Data): Buffer {
    const { username, password, domain = '', workstation = '' } = credentials;

    const ntHash = md4(encodeUTF16LE(password));
    const ntlmv2Hash = createHmac('md5', ntHash)
        .update(encodeUTF16LE(username.toUpperCase() + domain))
        .digest();

    const clientChallenge = randomBytes(8);
    const filetime = (BigInt(Date.now()) + EPOCH_DIFF_MS) * 10000n;
    const timestamp = Buffer.alloc(8);
    timestamp.writeBigUInt64LE(filetime);

    const blobHeader = Buffer.concat([
        Buffer.from([0x01, 0x01, 0x00, 0x00]),
        Buffer.alloc(4),
        timestamp,
        clientChallenge,
        Buffer.alloc(4),
    ]);
    const blob = Buffer.concat([blobHeader, type2.targetInfo, Buffer.alloc(4)]);

    const ntProofStr = createHmac('md5', ntlmv2Hash)
        .update(Buffer.concat([type2.serverChallenge, blob]))
        .digest();
    const ntResponse = Buffer.concat([ntProofStr, blob]);

    const lmResponse = Buffer.concat([
        createHmac('md5', ntlmv2Hash)
            .update(Buffer.concat([type2.serverChallenge, clientChallenge]))
            .digest(),
        clientChallenge,
    ]);

    const domainBuf = encodeUTF16LE(domain);
    const usernameBuf = encodeUTF16LE(username);
    const workstationBuf = encodeUTF16LE(workstation);

    const HEADER_SIZE = 64;
    let off = HEADER_SIZE;
    const lmOff = off; off += lmResponse.length;
    const ntOff = off; off += ntResponse.length;
    const domainOff = off; off += domainBuf.length;
    const userOff = off; off += usernameBuf.length;
    const wsOff = off; off += workstationBuf.length;
    const sessionOff = off;

    const msg = Buffer.alloc(off);
    SIGNATURE.copy(msg, 0);
    msg.writeUInt32LE(3, 8);
    writeFields(msg, 12, lmResponse.length, lmOff);
    writeFields(msg, 20, ntResponse.length, ntOff);
    writeFields(msg, 28, domainBuf.length, domainOff);
    writeFields(msg, 36, usernameBuf.length, userOff);
    writeFields(msg, 44, workstationBuf.length, wsOff);
    writeFields(msg, 52, 0, sessionOff);
    msg.writeUInt32LE(FLAGS, 60);

    lmResponse.copy(msg, lmOff);
    ntResponse.copy(msg, ntOff);
    domainBuf.copy(msg, domainOff);
    usernameBuf.copy(msg, userOff);
    workstationBuf.copy(msg, wsOff);

    return msg;
}
