import type { AddressInfo } from 'node:net';
import type { Socket } from 'node:net';

import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { once } from 'node:events';
import http from 'node:http';

import { httpRequest } from './http-request.js';

describe('httpRequest', () => {
    it('should perform a request and close the socket with agent: false', async () => {
        const sockets = new Set<Socket>();
        const server = http.createServer((req, res) => {
            sockets.add(req.socket);

            const chunks: Buffer[] = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', () => {
                res.writeHead(200, {
                    'x-echo-method': req.method ?? '',
                    'content-type': 'text/plain',
                });
                res.end(Buffer.concat(chunks));
            });
        });

        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            const { port } = server.address() as AddressInfo;
            const resp = await httpRequest(new URL(`http://127.0.0.1:${port}/echo`), {
                method: 'POST',
                headers: { Connection: 'close' },
                body: Buffer.from('payload'),
                agent: false,
            });

            strictEqual(resp.status, 200);
            strictEqual(resp.headers.get('x-echo-method'), 'POST');
            strictEqual(await resp.text(), 'payload');

            await Promise.all([...sockets].map(socket => {
                return socket.destroyed ? null : once(socket, 'close');
            }));
        } finally {
            server.close();
        }
    });
});
