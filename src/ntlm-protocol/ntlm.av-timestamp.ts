const MSV_AV_EOL = 0;
const MSV_AV_TIMESTAMP = 7;
const TIMESTAMP_LENGTH = 8;

export function findAvTimestamp(targetInfo: Buffer): Buffer | null {
    let off = 0;
    while (off + 4 <= targetInfo.length) {
        const id  = targetInfo.readUInt16LE(off);
        const len = targetInfo.readUInt16LE(off + 2);
        if (id === MSV_AV_EOL) {
            break;
        }

        const end = off + 4 + len;
        if (end > targetInfo.length) {
            break;
        }

        if (id === MSV_AV_TIMESTAMP && len === TIMESTAMP_LENGTH) {
            return Buffer.from(targetInfo.subarray(off + 4, end));
        }

        off = end;
    }

    return null;
}
