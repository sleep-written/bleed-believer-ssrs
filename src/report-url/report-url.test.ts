import { describe, it } from 'node:test';

import { ReportURL } from './report-url.js';

describe('ReportURL', () => {
    it('Create "https://4chan.org/ReportService"', (t: it.TestContext) => {
        const reportURL = new ReportURL('https://4chan.org/ReportService');
        t.assert.strictEqual(reportURL.href, 'https://4chan.org/ReportService');
    });
    
    it('Create "https://4chan.org/ReportService?/contr-venta"', (t: it.TestContext) => {
        const reportURL = new ReportURL(`https://4chan.org/ReportService?/contr-venta`);
        t.assert.strictEqual(reportURL.href, `https://4chan.org/ReportService?${encodeURIComponent('/contr-venta')}`);
    });

    it('Preserves hash fragments after the query string', (t: it.TestContext) => {
        const reportURL = new ReportURL('https://4chan.org/ReportService?a=1#frag');
        t.assert.strictEqual(reportURL.href, 'https://4chan.org/ReportService?a=1#frag');
        t.assert.strictEqual(reportURL.hash, '#frag');
    });

    it('toURL() returns an equivalent URL instance', (t: it.TestContext) => {
        const reportURL = new ReportURL('https://4chan.org/ReportService?a=1');
        t.assert.strictEqual(reportURL.toURL().href, 'https://4chan.org/ReportService?a=1');
    });
});