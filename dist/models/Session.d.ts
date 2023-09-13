export declare class Session {
    static isSaveLogs: boolean;
    static data: any;
    static setSaveLogs(isSaveLogs: boolean): void;
    static insertLog(id: string, value: any): void;
    static getLogs(id: string): any;
    static getHeaders(id: string): any;
    static getSessions(id: string): any;
    static getReplaces(id: string): any;
    static getSession(id: string, key: string): any;
    static setSession(id: string, key: string, value: any): void;
    static initSession(id: string, params: any): void;
    static writeLog(id: string): Promise<void>;
    static clearSession(id: string): void;
}
//# sourceMappingURL=Session.d.ts.map