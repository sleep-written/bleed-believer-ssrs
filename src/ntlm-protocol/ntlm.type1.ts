const SIGNATURE = Buffer.from('NTLMSSP\0');

const FLAGS =
    0x00000001 |  // NTLMSSP_NEGOTIATE_UNICODE
    0x00000004 |  // NTLMSSP_REQUEST_TARGET
    0x00000200 |  // NTLMSSP_NEGOTIATE_NTLM
    0x00008000 |  // NTLMSSP_NEGOTIATE_ALWAYS_SIGN
    0x00080000;   // NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY

export function buildType1(): Buffer {
    const msg = Buffer.alloc(32);
    SIGNATURE.copy(msg, 0);
    msg.writeUInt32LE(1, 8);
    msg.writeUInt32LE(FLAGS, 12);
    msg.writeUInt16LE(0, 16);
    msg.writeUInt16LE(0, 18);
    msg.writeUInt32LE(32, 20);
    msg.writeUInt16LE(0, 24);
    msg.writeUInt16LE(0, 26);
    msg.writeUInt32LE(32, 28);
    return msg;
}
