import { IncludeInterface } from '../models/Include';
export interface IIncludingParam {
    replaces?: any;
    headers?: any;
    list: IncludeInterface[];
    timeout?: number;
}
export declare function including(param: IIncludingParam): Promise<unknown>;
//# sourceMappingURL=including.d.ts.map