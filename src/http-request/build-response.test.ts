import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { buildResponse } from './build-response.js';

describe('buildResponse', () => {
    it('should build a response with status, headers and body', async () => {
        const resp = buildResponse(201, { 'content-type': 'text/plain' }, Buffer.from('hi'));
        strictEqual(resp.status, 201);
        strictEqual(resp.headers.get('content-type'), 'text/plain');
        strictEqual(await resp.text(), 'hi');
    });

    it('should join array header values', () => {
        const resp = buildResponse(200, { 'x-multi': [ 'a', 'b' ] }, Buffer.alloc(0));
        strictEqual(resp.headers.get('x-multi'), 'a, b');
    });

    it('should drop the body on null-body statuses', () => {
        const resp = buildResponse(304, {}, Buffer.from('ignored'));
        strictEqual(resp.status, 304);
        strictEqual(resp.body, null);
    });

    it('should fall back to 500 when status is missing or invalid', () => {
        strictEqual(buildResponse(undefined, {}, Buffer.alloc(0)).status, 500);
        strictEqual(buildResponse(99, {}, Buffer.alloc(0)).status, 500);
    });
});
