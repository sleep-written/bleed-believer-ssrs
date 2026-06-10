import { JSDOM } from 'jsdom';

export class SSRSError extends Error {
    static parse(input: string): SSRSError {
        try {
            const html = new JSDOM(input, { contentType: 'text/html',  });
            const item = html.window.document.querySelector('ul li');
            if (!item) {
                throw new Error();
            }

            const a = item.querySelector('a');
            a?.remove();

            const text = item.textContent ?? input;
            const fail = new SSRSError(text.trim());

            if (a) {
                fail.#href = a.href;
            }

            return fail;
        } catch {
            return new SSRSError(input.trim());
        }
    }

    #href = '#';

    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
    }

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
            `                ${this.message}`,
            `                <a href="${this.#href}" target="_blank">Get on-screen help</a>`,
            `            </li>`,
            `        </ul>`,
            `        <hr width="100%" size="1" color="silver">`,
            `        <span class="ProductInfo">SQL Server Reporting Services</span>`,
            `    </body>`,
            `</html>`,
        ].join('\n');
    }
}