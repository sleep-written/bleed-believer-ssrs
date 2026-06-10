const NAMED_ENTITIES: Record<string, string> = {
    'amp':  '&',
    'lt':   '<',
    'gt':   '>',
    'quot': '"',
    'apos': '\'',
    'nbsp': ' '
};

const ENTITY_PATTERN = /&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));/g;

export function unescapeHtml(input: string): string {
    return input.replace(ENTITY_PATTERN, (match, dec?: string, hex?: string, named?: string) => {
        if (dec) {
            const code = Number.parseInt(dec, 10);
            return code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }

        if (hex) {
            const code = Number.parseInt(hex, 16);
            return code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }

        return NAMED_ENTITIES[(named ?? '').toLowerCase()] ?? match;
    });
}
