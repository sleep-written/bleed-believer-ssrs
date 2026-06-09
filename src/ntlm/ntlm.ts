import type { NTLMCredentials } from './interfaces/index.js';

export class NTLM {
    #credentials: NTLMCredentials;

    constructor(credentials: NTLMCredentials) {
        this.#credentials = credentials;
    }

    async fetch(
        input: string | URL,
        init?: RequestInit
    ): Promise<Response> {
        throw new Error('Not implemented yet');
    }
}