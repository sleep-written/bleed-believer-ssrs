import type http from 'node:http';

export interface HttpRequestInit {
    method: string;
    headers: Record<string, string>;
    body?: Buffer;
    agent?: http.Agent | false;
}
