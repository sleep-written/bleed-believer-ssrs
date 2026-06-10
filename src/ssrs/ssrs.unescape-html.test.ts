import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { unescapeHtml } from './ssrs.unescape-html.js';

describe('unescapeHtml', () => {
    it('should decode named entities', () => {
        strictEqual(unescapeHtml('&lt;b&gt; &amp; &quot;c&quot;'), '<b> & "c"');
    });

    it('should decode numeric entities', () => {
        strictEqual(unescapeHtml('&#39;a&#39; &#x41;'), `'a' A`);
    });

    it('should leave unknown entities untouched', () => {
        strictEqual(unescapeHtml('&unknown; &#9999999999;'), '&unknown; &#9999999999;');
    });
});
