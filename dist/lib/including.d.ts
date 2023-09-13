import { Include } from "../models/Include";
export interface IIncludingParam {
    replaces?: any;
    headers?: any;
    list: Include[];
}
export declare function including(param: IIncludingParam): Promise<unknown>;
//# sourceMappingURL=including.d.ts.map