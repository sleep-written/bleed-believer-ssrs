import type { SSRSProtocol, SSRSReport, SSRSFormat } from './interfaces/index.js';
import type { QueryStringValue } from '../report-url/index.js';

import { ssrsFormat } from './ssrs-format.js';
import { ReportURL } from '../report-url/index.js';
import { SSRSError } from './ssrs.error.js';

export class SSRS {
    #protocol: SSRSProtocol;
    #baseUrl: string;

    constructor(baseUrl: string | URL, protocol: SSRSProtocol) {
        this.#protocol = protocol;
        this.#baseUrl = baseUrl instanceof URL
        ?   baseUrl.href
        :   baseUrl;
    }

    async renderReport(
        path: string,
        format: SSRSFormat,
        params?: Record<string, QueryStringValue>
    ): Promise<SSRSReport> {
        const url = new ReportURL(this.#baseUrl);
        url.queryString.set(path, null);
        url.queryString.set('rs:format', format);

        for (const [ key, value ] of Object.entries(params ?? {})) {
            url.queryString.set(key, value);
        }

        const resp = await this.#protocol.fetch(url.href);
        if (!resp.ok) {
            const text = await resp.text();
            throw SSRSError.parse(text);
        }

        const data = Buffer.from(await resp.arrayBuffer());
        const mime = ssrsFormat[format];
        return { data, mime };
    }
}