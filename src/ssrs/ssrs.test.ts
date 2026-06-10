import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { SSRSProtocolFake } from './ssrs-protocol.fake.js';
import { SSRSError } from './ssrs.error.js';
import { SSRS } from './ssrs.js';

describe('SSRS class', () => {
    it('should place the report path as the first query parameter', async () => {
        const fake = new SSRSProtocolFake([ new Response(new Uint8Array([ 1 ])) ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);
        await ssrs.renderReport('/a/b', 'PDF', { x: 1, multi: [ 'a', 'b' ] });

        strictEqual(
            fake.requests[0].input,
            'http://host/ReportServer?%2Fa%2Fb&rs%3AFormat=PDF&x=1&multi=a&multi=b'
        );
    });

    it('should keep the report path first when the base url has params', async () => {
        const fake = new SSRSProtocolFake([ new Response(new Uint8Array([ 1 ])) ]);
        const ssrs = new SSRS('http://host/ReportServer?keep=7', fake);
        await ssrs.renderReport('/r', 'PDF');

        strictEqual(
            fake.requests[0].input,
            'http://host/ReportServer?%2Fr&keep=7&rs%3AFormat=PDF'
        );
    });

    it('should translate null parameters to the isnull syntax', async () => {
        const fake = new SSRSProtocolFake([ new Response(new Uint8Array([ 1 ])) ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);
        await ssrs.renderReport('/r', 'PDF', { optional: null, x: 1 });

        strictEqual(
            fake.requests[0].input,
            'http://host/ReportServer?%2Fr&rs%3AFormat=PDF&optional%3Aisnull=true&x=1'
        );
    });

    it('should skip parameters with an empty array value', async () => {
        const fake = new SSRSProtocolFake([ new Response(new Uint8Array([ 1 ])) ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);
        await ssrs.renderReport('/r', 'PDF', { empty: [], x: 1 });

        strictEqual(
            fake.requests[0].input,
            'http://host/ReportServer?%2Fr&rs%3AFormat=PDF&x=1'
        );
    });

    it('should return the report data with mime from the content-type header', async () => {
        const fake = new SSRSProtocolFake([
            new Response(new Uint8Array([ 1, 2, 3 ]), {
                headers: { 'content-type': 'application/vnd.ms-excel' }
            }),
        ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);
        const report = await ssrs.renderReport('/r', 'EXCEL');

        deepStrictEqual(report.data, Buffer.from([ 1, 2, 3 ]));
        strictEqual(report.mime, 'application/vnd.ms-excel');
    });

    it('should fall back to the format mime when content-type is missing', async () => {
        const fake = new SSRSProtocolFake([ new Response(new Uint8Array([ 1 ])) ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);
        const report = await ssrs.renderReport('/r', 'PDF');

        strictEqual(report.mime, 'application/pdf');
    });

    it('should throw a parsed SSRSError on error responses', async () => {
        const page = new SSRSError('The item "/missing" cannot be found.').toHtml();
        const fake = new SSRSProtocolFake([ new Response(page, { status: 500 }) ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);

        await rejects(() => ssrs.renderReport('/missing', 'PDF'), {
            name: 'SSRSError',
            message: 'The item "/missing" cannot be found.'
        });
    });

    it('should throw an authentication error on 401', async () => {
        const fake = new SSRSProtocolFake([ new Response('', { status: 401 }) ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);

        await rejects(() => ssrs.renderReport('/r', 'PDF'), /Authentication failed/);
    });

    it('should throw a redirect error on 302', async () => {
        const fake = new SSRSProtocolFake([
            new Response(null, { status: 302, headers: { location: 'http://elsewhere/' } }),
        ]);
        const ssrs = new SSRS('http://host/ReportServer', fake);

        await rejects(() => ssrs.renderReport('/r', 'PDF'), /redirect to http:\/\/elsewhere\//);
    });
});
