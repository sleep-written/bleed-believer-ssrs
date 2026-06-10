import { ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { NTLMProtocolFake } from './ntlm-protocol.fake.js';
import { NTLMProtocol } from './ntlm-protocol.js';

function makeType2Response(): Response {
    const challenge = Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]);
    const targetInfo = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const infoOffset = 48;
    const buf = Buffer.alloc(infoOffset + targetInfo.length);
    Buffer.from('NTLMSSP\0').copy(buf, 0);
    buf.writeUInt32LE(2, 8);
    buf.writeUInt32LE(0x00088205, 20);
    challenge.copy(buf, 24);
    buf.writeUInt16LE(targetInfo.length, 40);
    buf.writeUInt16LE(targetInfo.length, 42);
    buf.writeUInt32LE(infoOffset, 44);
    targetInfo.copy(buf, infoOffset);
    const token = buf.toString('base64');
    return new Response('', { status: 401, headers: { 'www-authenticate': `NTLM ${token}` } });
}

const credentials = { username: 'user', password: 'pass', domain: 'DOMAIN' };

describe('NTLM class', () => {
    it('should return response immediately if server returns non-401', async () => {
        const fake = new NTLMProtocolFake([new Response('ok', { status: 200 })]);
        const ntlm = new NTLMProtocol(credentials, fake);
        const resp = await ntlm.fetch('http://example.com/');
        strictEqual(resp.status, 200);
        strictEqual(fake.requests.length, 1);
    });

    it('should perform 3-step NTLM handshake and return final response', async () => {
        const fake = new NTLMProtocolFake([
            new Response('', { status: 401, headers: { 'www-authenticate': 'NTLM' } }),
            makeType2Response(),
            new Response('data', { status: 200 }),
        ]);
        const ntlm = new NTLMProtocol(credentials, fake);
        const resp = await ntlm.fetch('http://example.com/report');
        ok(resp.ok);
        strictEqual(fake.requests.length, 3);
    });

    it('should send NTLM Type 1 in second request Authorization header', async () => {
        const fake = new NTLMProtocolFake([
            new Response('', { status: 401, headers: { 'www-authenticate': 'NTLM' } }),
            makeType2Response(),
            new Response('', { status: 200 }),
        ]);
        const ntlm = new NTLMProtocol(credentials, fake);
        await ntlm.fetch('http://example.com/');
        const auth = fake.requests[1].headers['Authorization'];
        ok(auth?.startsWith('NTLM '));
    });

    it('should send NTLM Type 3 in third request Authorization header', async () => {
        const fake = new NTLMProtocolFake([
            new Response('', { status: 401, headers: { 'www-authenticate': 'NTLM' } }),
            makeType2Response(),
            new Response('', { status: 200 }),
        ]);
        const ntlm = new NTLMProtocol(credentials, fake);
        await ntlm.fetch('http://example.com/');
        const auth = fake.requests[2].headers['Authorization'];
        ok(auth?.startsWith('NTLM '));
        const token = Buffer.from(auth!.slice(5), 'base64');
        strictEqual(token.toString('ascii', 0, 7), 'NTLMSSP');
        strictEqual(token.readUInt32LE(8), 3);
    });
});
