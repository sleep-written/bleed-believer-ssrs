import { unescapeHtml } from './ssrs.unescape-html.js';
import { escapeHtml } from './ssrs.escape-html.js';

const LIST_ITEM_PATTERN = /<li\b[^>]*>([\s\S]*?)<\/li>/i;
const ANCHOR_PATTERN = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>[\s\S]*?<\/a>/i;
const TAG_PATTERN = /<[^>]+>/g;

export class SSRSError extends Error {
    static parse(input: string): SSRSError {
        const item = input.match(LIST_ITEM_PATTERN)?.[1];
        if (item == null) {
            return new SSRSError(input.trim());
        }

        const anchor = item.match(ANCHOR_PATTERN);
        const text = item
            .replace(ANCHOR_PATTERN, ' ')
            .replace(TAG_PATTERN, ' ');

        const message = unescapeHtml(text).replace(/\s+/g, ' ').trim();
        const fail = new SSRSError(message);

        const href = anchor?.[1] ?? anchor?.[2];
        if (href) {
            fail.#href = href;
        }

        return fail;
    }

    #href = '#';

    name = 'SSRSError';

    toHtml(): string {
        return [
            `<html>`,
            `    <head>`,
            `        <title>SQL Server Reporting Services</title>`,
            `        <meta name="Generator" content="Microsoft SQL Server Reporting Services 66.6.666.666">`,
            `        <meta name="HTTP Status" content="500">`,
            `        <meta name="ProductLocaleID" content="666">`,
            `        <meta name="CountryLocaleID" content="666">`,
            `        <style>`,
            `            BODY {FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; FONT-WEIGHT:normal; FONT-SIZE: 10pt; COLOR:black}`,
            `            H1 {FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; FONT-WEIGHT:700; FONT-SIZE:15pt}`,
            `            LI {FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; FONT-WEIGHT:normal; FONT-SIZE:10pt; DISPLAY:inline}`,
            `            .ProductInfo {FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; FONT-WEIGHT:bold; FONT-SIZE: 10pt; COLOR:gray}`,
            `            A:link {FONT-SIZE: 10pt; FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; COLOR:#3366CC; TEXT-DECORATION:none}`,
            `            A:hover {FONT-SIZE: 10pt; FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; COLOR:#FF3300; TEXT-DECORATION:underline}`,
            `            A:visited {FONT-SIZE: 10pt; FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; COLOR:#3366CC; TEXT-DECORATION:none}`,
            `            A:visited:hover {FONT-SIZE: 10pt; FONT-FAMILY:'Segoe UI',Tahoma,Verdana,sans-serif; color:#FF3300; TEXT-DECORATION:underline}`,
            `        </style>`,
            `    </head>`,
            `    <body bgcolor="white">`,
            `        <h1>Error de Reporting Services<hr width="100%" size="1" color="silver"></h1>`,
            `        <ul>`,
            `            <li>`,
            `                ${escapeHtml(this.message)}`,
            `                <a href="${escapeHtml(this.#href)}" target="_blank">Get on-screen help</a>`,
            `            </li>`,
            `        </ul>`,
            `        <hr width="100%" size="1" color="silver">`,
            `        <span class="ProductInfo">SQL Server Reporting Services</span>`,
            `    </body>`,
            `</html>`,
        ].join('\n');
    }
}
