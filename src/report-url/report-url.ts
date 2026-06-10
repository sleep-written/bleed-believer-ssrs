import { QueryString } from './query-string.js';

export class ReportURL {
    #url: URL;
    get href(): string {
        return this.#url.href + this.#queryString.toString() + this.#hash;
    }

    get host(): string {
        return this.#url.host;
    }

    get port(): string {
        return this.#url.port;
    }

    get hostname(): string {
        return this.#url.hostname;
    }

    get pathname(): string {
        return this.#url.pathname;
    }

    get protocol(): string {
        return this.#url.protocol;
    }

    #hash: string;
    get hash(): string {
        return this.#hash;
    }

    #queryString: QueryString;
    get queryString(): QueryString {
        return this.#queryString;
    }

    constructor(input: string | URL) {
        this.#url = new URL(input);
        this.#queryString = QueryString.parse(this.#url.search);
        this.#hash = this.#url.hash;
        this.#url.search = '';
        this.#url.hash = '';
    }

    toURL(): URL {
        return new URL(this.href);
    }
}
