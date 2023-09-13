interface RequestOption {
    body?: any;
    headers?: any;
    method?: string;
    query?: any;
    timeout?: number;
}
export declare class HttpClient {
    sessionId?: string;
    constructor(params?: {
        sessionId: string;
    });
    request(url: string, params: RequestOption): Promise<unknown>;
}
export {};
//# sourceMappingURL=http-client.d.ts.map