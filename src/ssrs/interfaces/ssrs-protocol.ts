export interface SSRSProtocol {
    fetch(input: string | URL, init?: RequestInit): Promise<Response>;
}