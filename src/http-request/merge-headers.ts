export function mergeHeaders(base: Record<string, string>, headers?: HeadersInit): Record<string, string> {
    const out = { ...base };
    if (!headers) {
        return out;
    }

    if (headers instanceof Headers) {
        headers.forEach((v, k) => { out[k] = v; });
    } else if (Array.isArray(headers)) {
        for (const [ k, v ] of headers) { out[k] = v; }
    } else {
        Object.assign(out, headers);
    }

    return out;
}
