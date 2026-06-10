import type { SSRSProtocol, SSRSReport, SSRSFormat, SSRSReportParams } from './interfaces/index.js';

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
        params?: SSRSReportParams
    ): Promise<SSRSReport> {
        const url = new ReportURL(this.#baseUrl);
        url.queryString.set('rs:Format', format);

        for (const [ key, value ] of Object.entries(params ?? {})) {
            // SSRS URL Access expresses null parameters as `param:isnull=true`.
            if (value === null) {
                url.queryString.set(`${key}:isnull`, true);
                continue;
            }

            const values = Array.isArray(value) ? value : [ value ];
            if (values.length === 0) {
                continue;
            }

            const [ base, ...tail ] = values;
            url.queryString.append(key, base, ...tail);
        }

        // SSRS requires the report path to be the first query parameter,
        // even when the base url already carries its own parameters.
        url.queryString.prepend(path, null);

        const resp = await this.#protocol.fetch(url.href);
        if (resp.status === 401 || resp.status === 403) {
            throw new SSRSError(`Authentication failed: the server returned HTTP ${resp.status}`);
        }

        if (resp.status >= 300 && resp.status < 400) {
            const location = resp.headers.get('location') ?? 'an unknown location';
            throw new SSRSError(`Unexpected HTTP ${resp.status} redirect to ${location}`);
        }

        if (!resp.ok) {
            const text = await resp.text();
            throw SSRSError.parse(text);
        }

        const data = Buffer.from(await resp.arrayBuffer());
        const mime = resp.headers.get('content-type') ?? ssrsFormat[format];
        return { data, mime };
    }
}
