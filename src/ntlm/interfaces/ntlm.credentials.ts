export interface NTLMCredentials {
    workstation?: string;
    domain?: string;

    username: string;
    password: string;
}