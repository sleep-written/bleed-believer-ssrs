import type { QueryStringValue } from './query-string-value.js';

export class QueryString {
    static #datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

    static #parseValue(decoded: string): QueryStringValue {
        if (QueryString.#datePattern.test(decoded)) {
            const [datePart, timePart] = decoded.split('T');
            const [year, month, day]   = datePart.split('-').map(Number);
            const [hour, min, sec]     = timePart.split(':').map(Number);
            return new Date(year, month - 1, day, hour, min, sec);
        }

        if (decoded === 'true')  return true;
        if (decoded === 'false') return false;

        const num = Number(decoded);
        if (decoded !== '' && !isNaN(num)) return num;

        return decoded;
    }

    static parse(input: string): QueryString {
        const qs = new QueryString();
        const raw = input.startsWith('?') ? input.slice(1) : input;
        if (!raw) {
            return qs;
        }

        for (const part of raw.split('&')) {
            const eqIdx = part.indexOf('=');
            if (eqIdx === -1) {
                qs.append(decodeURIComponent(part), null);
            } else {
                const name  = decodeURIComponent(part.slice(0, eqIdx));
                const value = QueryString.#parseValue(decodeURIComponent(part.slice(eqIdx + 1)));
                qs.append(name, value);
            }
        }

        return qs;
    }

    #data = new Map<string, QueryStringValue[]>();

    set(name: string, value: QueryStringValue): QueryString {
        this.#data.set(name, [ value ]);
        return this;
    }

    append(name: string, ...values: [ QueryStringValue, ...QueryStringValue[] ]): QueryString {
        const foundValues = this.#data.get(name) ?? [];
        for (const value of values) {
            foundValues.push(value ?? null);
        }

        this.#data.set(name, foundValues);
        return this;
    }

    get(name: string): QueryStringValue | undefined {
        return this.#data.get(name)?.at(0);
    }

    has(name: string): boolean {
        const length = this.#data.get(name)?.length ?? 0;
        return length > 0;
    }

    getAll(name: string): QueryStringValue[] {
        return this.#data.get(name) ?? [];
    }

    delete(name: string): QueryString {
        this.#data.delete(name);
        return this;
    }

    #stringifyValue(value: QueryStringValue): string {
        switch (true) {
            case value instanceof Date: {
                const date = [
                    value.getFullYear()     .toString().padStart(4, '0'),
                    (value.getMonth() + 1)  .toString().padStart(2, '0'),
                    value.getDate()         .toString().padStart(2, '0'),
                ].join('-');
    
                const time = [
                    value.getHours()    .toString().padStart(2, '0'),
                    value.getMinutes()  .toString().padStart(2, '0'),
                    value.getSeconds()  .toString().padStart(2, '0'),
                ].join(':');
    
                return encodeURIComponent(`${date}T${time}`);
            }

            case typeof value === 'string': {
                return encodeURIComponent(value);
            }

            default: {
                return encodeURIComponent(JSON.stringify(value));
            }
        }
    }

    toString(): string {
        const out: string[] = [];

        for (const [ name, values ] of this.#data) {
            const key = encodeURIComponent(name);
            for (const v of values) {
                if (v !== null) {
                    const value = this.#stringifyValue(v);
                    out.push(`${key}=${value}`);
                } else {
                    out.push(key);
                }
            }
        }

        return out.length > 0
        ?   '?' + out.join('&')
        :   '';
    }
}