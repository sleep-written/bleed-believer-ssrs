import type { NTLMProtocolCredentials } from './interfaces/ntlm-protocol.credentials.js';
import type { NTLMProtocolInject } from './interfaces/ntlm-protocol.inject.js';

import https from 'node:https';
import http from 'node:http';

import { normalizeBody, mergeHeaders, httpRequest } from '../http-request/index.js';
import { buildType3 } from './ntlm.type3.js';
import { buildType1 } from './ntlm.type1.js';
import { parseType2 } from './ntlm.type2.js';

type NTLMHttpRequest = NonNullable<NTLMProtocolInject['httpRequest']>;

interface NTLMRequestInit {
    method: string;
    headers: Record<string, string>;
    body?: Buffer;
}

export class NTLMProtocol {
    #credentials: NTLMProtocolCredentials;
    #injected: NTLMProtocolInject;

    constructor(credentials: NTLMProtocolCredentials, inject?: NTLMProtocolInject) {
        this.#credentials = credentials;
        this.#injected = {
            httpRequest: inject?.httpRequest?.bind(inject),
        };
    }

    async #handshake(request: NTLMHttpRequest, url: URL, init: NTLMRequestInit): Promise<Response> {
        const { method, headers, body } = init;

        const r1 = await request(url, method, headers, body);
        if (r1.status !== 401) {
            return r1;
        }

        const wwwAuth1 = r1.headers.get('www-authenticate') ?? '';
        if (!wwwAuth1.toUpperCase().includes('NTLM')) {
            return r1;
        }

        const type1 = buildType1();
        const r2 = await request(url, method, {
            ...headers,
            Authorization: `NTLM ${type1.toString('base64')}`,
        }, body);

        if (r2.status !== 401) {
            return r2;
        }

        const wwwAuth2 = r2.headers.get('www-authenticate') ?? '';
        const ntlmToken = wwwAuth2.match(/NTLM\s+([A-Za-z0-9+/=]+)/i)?.[1];
        if (!ntlmToken) {
            throw new Error('Server did not return NTLM Type 2 challenge');
        }

        const type2 = parseType2(Buffer.from(ntlmToken, 'base64'));
        const type3 = buildType3(this.#credentials, type2);

        return request(url, method, {
            ...headers,
            Authorization: `NTLM ${type3.toString('base64')}`,
        }, body);
    }

    async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
        const url = new URL(input.toString());
        const method = (init?.method ?? 'GET').toUpperCase();
        const body = normalizeBody(init?.body);
        const headers = mergeHeaders({ Connection: 'keep-alive' }, init?.headers);

        const requestInit: NTLMRequestInit = { method, headers, body };
        const injected = this.#injected.httpRequest;
        if (injected) {
            return this.#handshake(injected, url, requestInit);
        }

        // One dedicated agent per call: NTLM authenticates the TCP connection,
        // so the whole handshake must stay on a single socket; destroying the
        // agent afterwards guarantees nothing is left open between calls.
        const agent = url.protocol === 'https:'
        ?   new https.Agent({ keepAlive: true, maxSockets: 1 })
        :   new http.Agent({ keepAlive: true, maxSockets: 1 });

        try {
            const request: NTLMHttpRequest = (u, m, h, b) =>
                httpRequest(u, { method: m, headers: h, body: b, agent });

            return await this.#handshake(request, url, requestInit);
        } finally {
            agent.destroy();
        }
    }
}
