export function normalizeBody(body: RequestInit['body']): Buffer | undefined {
    if (body == null) {
        return undefined;
    }

    if (typeof body === 'string') {
        return Buffer.from(body);
    }

    if (body instanceof ArrayBuffer) {
        return Buffer.from(body);
    }

    if (ArrayBuffer.isView(body)) {
        return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    }

    if (body instanceof URLSearchParams) {
        return Buffer.from(body.toString());
    }

    throw new TypeError(
        'httpRequest: unsupported body type; ' +
        'use string, Buffer, TypedArray, ArrayBuffer or URLSearchParams'
    );
}
