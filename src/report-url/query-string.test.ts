import { describe, it } from 'node:test';
import { QueryString } from './query-string.js';

describe('new QueryString()', () => {
    it('Create "?foo"', (t: it.TestContext) => {
        const queryString = new QueryString();
        queryString.set('foo', null);

        t.assert.strictEqual(queryString.toString(), '?foo');
    });

    it('Create "?foo=bar"', (t: it.TestContext) => {
        const queryString = new QueryString();
        queryString.set('foo', 'bar');

        t.assert.strictEqual(queryString.toString(), '?foo=bar');
    });

    it('Create "?foo&bar=baz"', (t: it.TestContext) => {
        const queryString = new QueryString();
        queryString.set('foo', null);
        queryString.set('bar', 'baz');

        t.assert.strictEqual(queryString.toString(), '?foo&bar=baz');
    });

    it('Create "?foo&bar=bak&bar=baz"', (t: it.TestContext) => {
        const queryString = new QueryString();
        queryString.set('foo', null);
        queryString.append('bar', 'bak', 'baz');

        t.assert.strictEqual(queryString.toString(), '?foo&bar=bak&bar=baz');
    });

    it('Create "?%2Fcontr-venta&desde=2026-06-01T00%3A00%3A00&hasta=2026-06-08T00%3A00%3A00"', (t: it.TestContext) => {
        const queryString = new QueryString();
        queryString.set('/contr-venta', null);
        queryString.set('desde', new Date(2026, 5, 1));
        queryString.set('hasta', new Date(2026, 5, 8));

        t.assert.strictEqual(queryString.toString(), '?%2Fcontr-venta&desde=2026-06-01T00%3A00%3A00&hasta=2026-06-08T00%3A00%3A00');
    });
});

describe('QueryString.parse', () => {
    it('Parse "?foo" (null)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?foo');
        t.assert.strictEqual(queryString.get('foo'), null);
        t.assert.strictEqual(queryString.toString(), '?foo');
    });

    it('Parse "?foo=bar" (string)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?foo=bar');
        t.assert.strictEqual(queryString.get('foo'), 'bar');
        t.assert.strictEqual(queryString.toString(), '?foo=bar');
    });

    it('Parse "?foo&bar=baz" (null + string)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?foo&bar=baz');
        t.assert.strictEqual(queryString.get('foo'), null);
        t.assert.strictEqual(queryString.get('bar'), 'baz');
        t.assert.strictEqual(queryString.toString(), '?foo&bar=baz');
    });

    it('Parse "?foo&bar=bak&bar=baz" (multiple values)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?foo&bar=bak&bar=baz');
        t.assert.deepStrictEqual(queryString.getAll('bar'), ['bak', 'baz']);
        t.assert.strictEqual(queryString.toString(), '?foo&bar=bak&bar=baz');
    });

    it('Parse "?active=true" (boolean true)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?active=true');
        t.assert.strictEqual(queryString.get('active'), true);
        t.assert.strictEqual(queryString.toString(), '?active=true');
    });

    it('Parse "?active=false" (boolean false)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?active=false');
        t.assert.strictEqual(queryString.get('active'), false);
        t.assert.strictEqual(queryString.toString(), '?active=false');
    });

    it('Parse "?count=42" (integer)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?count=42');
        t.assert.strictEqual(queryString.get('count'), 42);
        t.assert.strictEqual(queryString.toString(), '?count=42');
    });

    it('Parse "?ratio=3.14" (float)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?ratio=3.14');
        t.assert.strictEqual(queryString.get('ratio'), 3.14);
        t.assert.strictEqual(queryString.toString(), '?ratio=3.14');
    });

    it('Parse "?%2Fcontr-venta&desde=2026-06-01T00%3A00%3A00&hasta=2026-06-08T00%3A00%3A00" (Date)', (t: it.TestContext) => {
        const queryString = QueryString.parse('?%2Fcontr-venta&desde=2026-06-01T00%3A00%3A00&hasta=2026-06-08T00%3A00%3A00');

        t.assert.strictEqual(queryString.get('/contr-venta'), null);
        t.assert.strictEqual(queryString.get('desde')?.toString(), new Date(2026, 5, 1).toString());
        t.assert.strictEqual(queryString.get('hasta')?.toString(), new Date(2026, 5, 8).toString());
        t.assert.strictEqual(queryString.toString(), '?%2Fcontr-venta&desde=2026-06-01T00%3A00%3A00&hasta=2026-06-08T00%3A00%3A00');
    });
});