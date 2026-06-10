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
});