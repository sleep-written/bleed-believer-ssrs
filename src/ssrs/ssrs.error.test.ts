import { ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { SSRSError } from './ssrs.error.js';

describe('SSRSError', () => {
    it('should set the error name to SSRSError', () => {
        const fail = new SSRSError('boom');
        strictEqual(fail.name, 'SSRSError');
        ok(fail instanceof Error);
    });

    it('should round-trip the message through toHtml + parse', () => {
        const original = new SSRSError('The path of the item "/foo" is not valid.');
        const parsed = SSRSError.parse(original.toHtml());
        strictEqual(parsed.message, 'The path of the item "/foo" is not valid.');
    });

    it('should extract the message and help link from an error page', () => {
        const html = [
            '<html><body><ul><li>',
            'Some failure',
            '<a href="https://aka.ms/help" target="_blank">Get help</a>',
            '</li></ul></body></html>',
        ].join('\n');

        const parsed = SSRSError.parse(html);
        strictEqual(parsed.message, 'Some failure');
        ok(parsed.toHtml().includes('href="https://aka.ms/help"'));
    });

    it('should fall back to the raw input when no list item is present', () => {
        strictEqual(SSRSError.parse('  plain failure  ').message, 'plain failure');
    });

    it('should escape markup in toHtml and decode it back on parse', () => {
        const fail = new SSRSError('a < b & "c"');
        ok(fail.toHtml().includes('a &lt; b &amp; &quot;c&quot;'));
        strictEqual(SSRSError.parse(fail.toHtml()).message, 'a < b & "c"');
    });
});
