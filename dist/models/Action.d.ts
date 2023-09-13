export declare class Action {
    url: string;
    model: string;
    query: any;
    select: string;
    method: string;
    body: any;
    headers: any;
    sessions: any;
    then: Action[];
    constructor(data: any);
    static fromJSON(data: any): Action;
}
//# sourceMappingURL=Action.d.ts.map