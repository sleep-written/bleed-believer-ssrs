import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { escapeHtml } from './ssrs.escape-html.js';

describe('escapeHtml', () => {
    it('should escape markup-sensitive characters', () => {
        strictEqual(
            escapeHtml(`<a href="x">'b' & c</a>`),
            '&lt;a href=&quot;x&quot;&gt;&#39;b&#39; &amp; c&lt;/a&gt;'
        );
    });

    it('should leave plain text untouched', () => {
        strictEqual(escapeHtml('plain text 123'), 'plain text 123');
    });
});
