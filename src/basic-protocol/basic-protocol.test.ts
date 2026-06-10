import type { AddressInfo } from 'node:net';

import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import http from 'node:http';

import { BasicProtocolFake } from './basic-protocol.fake.js';
import { BasicProtocol } from './basic-protocol.js';

const credentials = { username: 'user', password: 'p4ss:word' };
const expectedAuth = `Basic ${Buffer.from('user:p4ss:word').toString('base64')}`;

describe('BasicProtocol class', () => {
    it('should send the Basic Authorization header', async () => {
        const fake = new BasicProtocolFake([ new Response('ok', { status: 200 }) ]);
        const basic = new BasicProtocol(credentials, fake);
        const resp = await basic.fetch('http://example.com/');

        strictEqual(resp.status, 200);
        strictEqual(fake.requests.length, 1);
        strictEqual(fake.requests[0].headers['Authorization'], expectedAuth);
    });

    it('should uppercase the method and forward the body', async () => {
        const fake = new BasicProtocolFake([ new Response('', { status: 200 }) ]);
        const basic = new BasicProtocol(credentials, fake);
        await basic.fetch('http://example.com/', { method: 'post', body: 'data' });

        strictEqual(fake.requests[0].method, 'POST');
        deepStrictEqual(fake.requests[0].body, Buffer.from('data'));
    });

    it('should merge custom headers but keep its own Authorization', async () => {
        const fake = new BasicProtocolFake([ new Response('', { status: 200 }) ]);
        const basic = new BasicProtocol(credentials, fake);
        await basic.fetch('http://example.com/', {
            headers: { 'x-custom': 'yes', 'Authorization': 'Bearer hijacked' }
        });

        strictEqual(fake.requests[0].headers['x-custom'], 'yes');
        strictEqual(fake.requests[0].headers['Authorization'], expectedAuth);
    });

    it('should return error responses untouched', async () => {
        const fake = new BasicProtocolFake([ new Response('denied', { status: 401 }) ]);
        const basic = new BasicProtocol(credentials, fake);
        const resp = await basic.fetch('http://example.com/');

        strictEqual(resp.status, 401);
        strictEqual(await resp.text(), 'denied');
    });

    it('should authenticate against a real server with one request', async () => {
        let requests = 0;
        const server = http.createServer((req, res) => {
            requests++;
            if (req.headers.authorization !== expectedAuth) {
                res.writeHead(401, { 'www-authenticate': 'Basic realm="ssrs"' });
                return res.end();
            }

            res.writeHead(200, { 'content-type': 'text/plain' });
            res.end('authenticated');
        });

        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            const { port } = server.address() as AddressInfo;
            const basic = new BasicProtocol(credentials);
            const resp = await basic.fetch(`http://127.0.0.1:${port}/`);

            strictEqual(resp.status, 200);
            strictEqual(await resp.text(), 'authenticated');
            strictEqual(requests, 1);
        } finally {
            server.close();
        }
    });
});
