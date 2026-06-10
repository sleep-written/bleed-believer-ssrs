# @bleed-believer/ssrs

A TypeScript library for rendering reports from SQL Server Reporting Services (SSRS) using NTLM authentication.

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

## API

### `NTLMProtocol`

Handles NTLM authentication against the SSRS server.

```typescript
const ntlm = new NTLMProtocol({
    username:    string,   // required
    password:    string,   // required
    domain?:     string,
    workstation?: string
});
```

### `SSRS`

Main class for interacting with the report server.

```typescript
const ssrs = new SSRS(baseUrl: string | URL, protocol: NTLMProtocol);
```

#### `ssrs.renderReport(path, format, params?)`

Renders a report and returns a `SSRSReport` object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Report path on the server (e.g. `'/Reports/MyReport'`) |
| `format` | `SSRSFormat` | Output format (see below) |
| `params` | `SSRSReportParams` | Optional report parameters |

`SSRSReportParams` is `Record<string, SSRSReportParamValue | SSRSReportParamValue[]>`, where `SSRSReportParamValue` is `string | number | boolean | Date`. Each parameter accepts a single value or an array of values for multi-value parameters:

```typescript
await ssrs.renderReport('/Reports/Sales', 'PDF', {
    region:    ['North', 'South', 'East'],   // multi-value
    startDate: new Date(2026, 0, 1),         // single value
    active:    true
});
```

Returns `Promise<SSRSReport>`:

```typescript
interface SSRSReport {
    mime: string;   // MIME type of the rendered file
    data: Buffer;   // File contents
}
```

### `SSRSFormat`

Supported output formats:

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
