import type http from 'node:http';

const NULL_BODY_STATUSES = new Set([ 101, 204, 205, 304 ]);

export function buildResponse(
    statusCode: number | undefined,
    headers: http.IncomingHttpHeaders,
    body: Buffer<ArrayBuffer>
): Response {
    const status = statusCode != null && statusCode >= 200 && statusCode <= 599
    ?   statusCode
    :   500;

    const hdrs: Record<string, string> = {};
    for (const [ k, v ] of Object.entries(headers)) {
        if (v !== undefined) {
            hdrs[k] = Array.isArray(v) ? v.join(', ') : v;
        }
    }

    return new Response(
        NULL_BODY_STATUSES.has(status) ? null : body,
        { status, headers: hdrs }
    );
}
