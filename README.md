# @bleed-believer/ssrs

A TypeScript library for rendering reports from SQL Server Reporting Services (SSRS) using NTLM authentication. Zero runtime dependencies.

## Installation

```bash
npm install @bleed-believer/ssrs
```

## Usage

```typescript
import { NTLMProtocol, SSRS } from '@bleed-believer/ssrs';
import { writeFile } from 'node:fs/promises';

const ntlm = new NTLMProtocol({
    username: 'administrator',
    password: 'your-password'
});

const ssrs = new SSRS('http://your-server/ReportServer', ntlm);
const file = await ssrs.renderReport('/Reports/MyReport', 'PDF', {
    startDate: new Date(2026, 0, 1),
    endDate:   new Date(2026, 0, 31)
});

await writeFile('./report.pdf', file.data);
```

### Parallel rendering

Every `renderReport` call is fully independent: each one opens its own dedicated
connection, performs its own NTLM handshake, and closes the connection when the
response arrives. Nothing is shared between calls and no sockets are left open,
so you can safely render multiple reports in parallel with a single instance:

```typescript
await Promise.all([
    ssrs.renderReport('/Reports/Sales',   'EXCELOPENXML', { year: 2026 })
        .then(({ data }) => writeFile('./sales.xlsx', data)),
    ssrs.renderReport('/Reports/Summary', 'PDF', { year: 2026 })
        .then(({ data }) => writeFile('./summary.pdf', data)),
]);
```

## API

### `NTLMProtocol`

Handles NTLM (NTLMv2) authentication against the SSRS server. The instance only
holds the credentials; each request creates and disposes its own connection.

```typescript
const ntlm = new NTLMProtocol({
    username:    string,   // required
    password:    string,   // required
    domain?:     string,
    workstation?: string
});
```

#### `ntlm.fetch(input, init?)`

A `fetch`-like method that transparently performs the NTLM handshake and returns
a standard `Response`. Supports `method`, `headers` and `body` (as `string`,
`Buffer`, `TypedArray`, `ArrayBuffer` or `URLSearchParams`) from `RequestInit`.
Redirects are not followed.

```typescript
const resp = await ntlm.fetch('http://your-server/ReportServer?%2FReports%2FMyReport&rs:Format=PDF');
```

### `BasicProtocol`

HTTP Basic authentication, for servers configured with `RSWindowsBasic`. Same
`fetch`-like contract and the same connection model as `NTLMProtocol` (one
ephemeral connection per request, closed when the response arrives), but with a
single request instead of a handshake. Use it only over HTTPS — Basic sends the
credentials with every request, merely base64-encoded.

```typescript
import { BasicProtocol, SSRS } from '@bleed-believer/ssrs';

const basic = new BasicProtocol({
    username: 'administrator',
    password: 'your-password'
});

const ssrs = new SSRS('https://your-server/ReportServer', basic);
```

### `SSRS`

Main class for interacting with the report server.

```typescript
const ssrs = new SSRS(baseUrl: string | URL, protocol: SSRSProtocol);
```

The second argument accepts anything implementing `SSRSProtocol`
(`{ fetch(input, init?): Promise<Response> }`), so you can plug in a custom
transport instead of `NTLMProtocol` if your server uses another auth scheme.

#### `ssrs.renderReport(path, format, params?)`

Renders a report and returns a `SSRSReport` object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Report path on the server (e.g. `'/Reports/MyReport'`) |
| `format` | `SSRSFormat` | Output format (see below) |
| `params` | `SSRSReportParams` | Optional report parameters |

`SSRSReportParams` is `Record<string, SSRSReportParamValue | SSRSReportParamValue[] | null>`, where `SSRSReportParamValue` is `string | number | boolean | Date`. Each parameter accepts a single value, an array of values for multi-value parameters (empty arrays are omitted), or `null`:

```typescript
await ssrs.renderReport('/Reports/Sales', 'PDF', {
    region:    ['North', 'South', 'East'],   // multi-value
    startDate: new Date(2026, 0, 1),         // single value
    endDate:   null,                         // null parameter
    active:    true
});
```

A `null` value is translated to the SSRS URL Access null syntax
(`endDate:isnull=true` in the example above). The report parameter must be
defined as nullable (*Allow null value*) in the report, otherwise the server
rejects the render. Multi-value arrays cannot contain `null` members because
SSRS does not support them.

Returns `Promise<SSRSReport>`:

```typescript
interface SSRSReport {
    mime: string;   // MIME type reported by the server (Content-Type header),
                    // falling back to the format's default when absent
    data: Buffer;   // File contents
}
```

### `SSRSError`

Every failed render throws a `SSRSError` (`error.name === 'SSRSError'`):

- **HTTP 401/403** → `Authentication failed: the server returned HTTP <status>`.
- **HTTP 3xx** → `Unexpected HTTP <status> redirect to <location>`.
- **Any other non-2xx** → the human-readable message is extracted from the SSRS
  HTML error page; if the body is not an SSRS error page, the raw text is used.

```typescript
import { SSRSError } from '@bleed-believer/ssrs';

try {
    await ssrs.renderReport('/Reports/Missing', 'PDF');
} catch (err) {
    if (err instanceof SSRSError) {
        console.error('SSRS rejected the render:', err.message);
    } else {
        throw err;
    }
}
```

### `SSRSFormat`

Supported output formats and their fallback MIME types (used when the server
does not send a `Content-Type` header):

| Value | MIME type |
|-------|-----------|
| `'PDF'` | `application/pdf` |
| `'EXCEL'` | `application/vnd.ms-excel` |
| `'EXCELOPENXML'` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `'WORD'` | `application/msword` |
| `'WORDOPENXML'` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `'PPTX'` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| `'CSV'` | `text/csv` |
| `'XML'` | `application/xml` |
| `'IMAGE'` | `image/tiff` |
| `'HTML4.0'` | `text/html` |
| `'HTML5'` | `text/html` |
| `'MHTML'` | `multipart/related` |
| `'ATOM'` | `application/atomsvc+xml` |
| `'RPL'` | `application/octet-stream` |
| `'NULL'` | `application/octet-stream` |
