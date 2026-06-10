export interface NTLMProtocolInject {
    httpRequest?(
        url: URL,
        method: string,
        headers: Record<string, string>
    ): Promise<Response>;
}