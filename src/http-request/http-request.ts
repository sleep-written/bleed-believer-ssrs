import type { HttpRequestInit } from './interfaces/http-request-init.js';

import https from 'node:https';
import http from 'node:http';

import { buildResponse } from './build-response.js';

export function httpRequest(url: URL, init: HttpRequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: init.method,
            headers: init.headers,
            agent: init.agent,
        };

        function onResponse(res: http.IncomingMessage): void {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => {
                resolve(buildResponse(res.statusCode, res.headers, Buffer.concat(chunks)));
            });
            res.on('error', reject);
        }

        const req = url.protocol === 'https:'
        ?   https.request(opts, onResponse)
        :   http.request(opts, onResponse);

        req.on('error', reject);
        req.end(init.body);
    });
}
