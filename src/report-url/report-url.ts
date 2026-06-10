import { QueryString } from './query-string.js';

export class ReportURL {
    #url: URL;
    get href(): string {
        return this.#url.href + this.#queryString.toString();
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

    #queryString: QueryString;
    get queryString(): QueryString {
        return this.#queryString;
    }

    constructor(input: string | URL) {
        this.#url = new URL(input);
        this.#queryString = QueryString.parse(this.#url.search);
        this.#url.search = '';
    }

    toURL(): URL {
        return new URL(this.href);
    }
}