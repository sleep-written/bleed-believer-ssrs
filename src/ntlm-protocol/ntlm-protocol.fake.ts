import type { NTLMProtocolInject } from './interfaces/ntlm-protocol.inject.js';

export class NTLMProtocolFake implements NTLMProtocolInject {
    #responses: Response[];
    #requests: Array<{ url: URL; method: string; headers: Record<string, string>; body?: Buffer }>;

    constructor(responses: Response[]) {
        this.#responses = [...responses];
        this.#requests = [];
    }

    async httpRequest(
        url: URL,
        method: string,
        headers: Record<string, string>,
        body?: Buffer
    ): Promise<Response> {
        this.#requests.push({ url, method, headers, body });
        const resp = this.#responses.shift();
        if (!resp) {
            throw new Error('NTLMFake: no more responses configured');
        }
        return resp;
    }

    get requests(): Array<{ url: URL; method: string; headers: Record<string, string>; body?: Buffer }> {
        return [...this.#requests];
    }
}
