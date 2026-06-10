export interface NTLMProtocolCredentials {
    workstation?: string;
    domain?: string;

    username: string;
    password: string;
}