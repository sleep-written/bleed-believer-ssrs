export interface BasicProtocolInject {
    httpRequest?(
        url: URL,
        method: string,
        headers: Record<string, string>,
        body?: Buffer
    ): Promise<Response>;
}
