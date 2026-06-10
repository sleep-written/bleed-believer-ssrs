export interface NTLMType2Data {
    flags: number;
    serverChallenge: Buffer;
    targetInfo: Buffer;
}
