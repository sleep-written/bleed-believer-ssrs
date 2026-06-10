export function encodeUTF16LE(str: string): Buffer {
    const buf = Buffer.alloc(str.length * 2);
    for (let i = 0; i < str.length; i++) {
        buf.writeUInt16LE(str.charCodeAt(i), i * 2);
    }
    return buf;
}
