import type { BasicProtocolCredentials } from './interfaces/basic-protocol.credentials.js';
import type { BasicProtocolInject } from './interfaces/basic-protocol.inject.js';

import { normalizeBody, mergeHeaders, httpRequest } from '../http-request/index.js';

export class BasicProtocol {
    #credentials: BasicProtocolCredentials;
    #injected: Required<BasicProtocolInject>;

    constructor(credentials: BasicProtocolCredentials, inject?: BasicProtocolInject) {
        this.#credentials = credentials;
        this.#injected = {
            httpRequest: inject?.httpRequest?.bind(inject) ??
                ((url, method, headers, body) => httpRequest(url, { method, headers, body, agent: false })),
        };
    }

    fetch(input: string | URL, init?: RequestInit): Promise<Response> {
        const url = new URL(input.toString());
        const method = (init?.method ?? 'GET').toUpperCase();
        const body = normalizeBody(init?.body);

        // `Connection: close` + no agent: one ephemeral socket per request,
        // nothing is left open afterwards.
        const headers = mergeHeaders({ Connection: 'close' }, init?.headers);
        const { username, password } = this.#credentials;
        headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

        return this.#injected.httpRequest(url, method, headers, body);
    }
}
