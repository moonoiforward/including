import { Include, IncludeInterface } from "../models/Include";
export interface IIncludingParam {
    replaces?: any;
    headers?: any;
    list: IncludeInterface[];
    timeout?: number;
}
export declare function including(param: IIncludingParam): Promise<unknown>;
export declare function onSuccess({ sessionId, inc, data, dimension, }: {
    sessionId: string;
    inc: Include;
    data: any;
    dimension: number;
}): Promise<unknown>;
//# sourceMappingURL=including.d.ts.map