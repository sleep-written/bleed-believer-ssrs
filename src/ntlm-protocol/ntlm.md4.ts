function add(a: number, b: number): number {
    return (a + b) | 0;
}

function rotl(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
}

const R1_K = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const R1_S = [3, 7, 11, 19];
const R2_K = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
const R2_S = [3, 5, 9, 13];
const R3_K = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
const R3_S = [3, 9, 11, 15];

export function md4(input: Buffer): Buffer {
    const inputLen = input.length;
    const bitLen = inputLen * 8;
    const paddedLen = ((inputLen + 9 + 63) & ~63);
    const padded = Buffer.alloc(paddedLen);
    input.copy(padded);
    padded[inputLen] = 0x80;
    padded.writeUInt32LE(bitLen >>> 0, paddedLen - 8);
    padded.writeUInt32LE(Math.floor(bitLen / 0x100000000), paddedLen - 4);

    let A = 0x67452301;
    let B = 0xEFCDAB89;
    let C = 0x98BADCFE;
    let D = 0x10325476;

    for (let blk = 0; blk < paddedLen; blk += 64) {
        const X: number[] = [];
        for (let i = 0; i < 16; i++) {
            X.push(padded.readUInt32LE(blk + i * 4));
        }

        const AA = A, BB = B, CC = C, DD = D;
        let regs: [number, number, number, number] = [A, B, C, D];

        for (let i = 0; i < 16; i++) {
            const [ra, rb, rc, rd] = regs;
            const f = (rb & rc) | (~rb & rd);
            const t = rotl(add(add(ra, f), X[R1_K[i]]), R1_S[i % 4]);
            regs = [rd, t, rb, rc];
        }

        for (let i = 0; i < 16; i++) {
            const [ra, rb, rc, rd] = regs;
            const g = (rb & rc) | (rb & rd) | (rc & rd);
            const t = rotl(add(add(add(ra, g), X[R2_K[i]]), 0x5A827999), R2_S[i % 4]);
            regs = [rd, t, rb, rc];
        }

        for (let i = 0; i < 16; i++) {
            const [ra, rb, rc, rd] = regs;
            const h = rb ^ rc ^ rd;
            const t = rotl(add(add(add(ra, h), X[R3_K[i]]), 0x6ED9EBA1), R3_S[i % 4]);
            regs = [rd, t, rb, rc];
        }

        A = add(AA, regs[0]);
        B = add(BB, regs[1]);
        C = add(CC, regs[2]);
        D = add(DD, regs[3]);
    }

    const out = Buffer.alloc(16);
    out.writeInt32LE(A, 0);
    out.writeInt32LE(B, 4);
    out.writeInt32LE(C, 8);
    out.writeInt32LE(D, 12);
    return out;
}
