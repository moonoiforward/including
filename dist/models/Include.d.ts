export declare class Include {
    url: string;
    model: string;
    method: string;
    default?: any;
    query?: any;
    headers?: any;
    body?: any;
    params?: string[];
    sessions?: any;
    selects?: string[];
    excludes?: string[];
    on?: string;
    duplicate?: boolean;
    delimiter?: string;
    foreign?: string;
    local?: string;
    select?: string;
    whole?: boolean;
    each?: boolean;
    pagination?: boolean;
    includes?: Include[];
    branches?: Include[];
    constructor(data: any);
    static fromJSON(data: any): Include;
}
//# sourceMappingURL=Include.d.ts.map