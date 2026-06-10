import type { SSRSProtocol } from './interfaces/ssrs-protocol.js';

export class SSRSProtocolFake implements SSRSProtocol {
    #responses: Response[];
    #requests: Array<{ input: string | URL; init?: RequestInit }>;

    constructor(responses: Response[]) {
        this.#responses = [...responses];
        this.#requests = [];
    }

    get requests(): Array<{ input: string | URL; init?: RequestInit }> {
        return [...this.#requests];
    }

    async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
        this.#requests.push({ input, init });
        const resp = this.#responses.shift();
        if (!resp) {
            throw new Error('SSRSProtocolFake: no more responses configured');
        }
        return resp;
    }
}
