import type { NTLMProtocolCredentials } from './interfaces/ntlm-protocol.credentials.js';
import type { NTLMProtocolInject } from './interfaces/ntlm-protocol.inject.js';

import https from 'node:https';
import http from 'node:http';

import { buildType3 } from './ntlm.type3.js';
import { buildType1 } from './ntlm.type1.js';
import { parseType2 } from './ntlm.type2.js';

interface NTLMAgents {
    http: http.Agent;
    https: https.Agent;
}

export class NTLMProtocol {
    static #makeHttpRequest(
        agents: NTLMAgents,
        url: URL,
        method: string,
        headers: Record<string, string>
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const opts = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method,
                headers,
            };

            let req: http.ClientRequest;
            if (url.protocol === 'https:') {
                req = https.request({ ...opts, agent: agents.https }, onResponse);
            } else {
                req = http.request({ ...opts, agent: agents.http }, onResponse);
            }

            function onResponse(res: http.IncomingMessage) {
                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () => {
                    const body = Buffer.concat(chunks);
                    const hdrs: Record<string, string> = {};
                    for (const [k, v] of Object.entries(res.headers)) {
                        if (v !== undefined) {
                            hdrs[k] = Array.isArray(v) ? v.join(', ') : v;
                        }
                    }
                    resolve(new Response(body, { status: res.statusCode ?? 0, headers: hdrs }));
                });
                res.on('error', reject);
            }

            req.on('error', reject);
            req.end();
        });
    }

    #credentials: NTLMProtocolCredentials;
    #injected: Required<NTLMProtocolInject>;

    constructor(credentials: NTLMProtocolCredentials, inject?: NTLMProtocolInject) {
        this.#credentials = credentials;
        const agents: NTLMAgents = {
            http: new http.Agent({ keepAlive: true }),
            https: new https.Agent({ keepAlive: true }),
        };
        this.#injected = {
            httpRequest: inject?.httpRequest?.bind(inject) ??
                ((url, method, headers) => NTLMProtocol.#makeHttpRequest(agents, url, method, headers)),
        };
    }

    async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
        const url = new URL(input.toString());
        const method = (init?.method ?? 'GET').toUpperCase();
        const baseHeaders: Record<string, string> = { Connection: 'keep-alive' };

        if (init?.headers) {
            if (init.headers instanceof Headers) {
                init.headers.forEach((v, k) => { baseHeaders[k] = v; });
            } else if (Array.isArray(init.headers)) {
                for (const [k, v] of init.headers) { baseHeaders[k] = v; }
            } else {
                Object.assign(baseHeaders, init.headers);
            }
        }

        const r1 = await this.#injected.httpRequest(url, method, baseHeaders);
        if (r1.status !== 401) {
            return r1;
        }

        const wwwAuth1 = r1.headers.get('www-authenticate') ?? '';
        if (!wwwAuth1.toUpperCase().includes('NTLM')) {
            return r1;
        }

        const type1 = buildType1();
        const r2 = await this.#injected.httpRequest(url, method, {
            ...baseHeaders,
            Authorization: `NTLM ${type1.toString('base64')}`,
        });

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

        return this.#injected.httpRequest(url, method, {
            ...baseHeaders,
            Authorization: `NTLM ${type3.toString('base64')}`,
        });
    }
}
