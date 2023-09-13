import { Identity } from "../models/Identity";
import { Include } from "../models/Include";
export declare function replaceUrl(url: string, replaces: any): string;
export declare function mapParams(item: string, identity: any): string;
export declare function createQuery({ query, sessionId, }: {
    query: any;
    sessionId: string;
}): any;
export declare function mapIdentities(identities: Identity[]): any[];
/**
 * create key by inc.on for build query/body api
 * @param param0
 * @returns
 */
export declare function mapKeynameForIncludes({ inc, identity, flatData, identities, }: {
    flatData: any;
    identity?: Identity;
    identities: any[];
    inc: Include;
}): string[];
export declare function createIdentities({ inc, keys, flatData, }: {
    flatData: any;
    keys: string[];
    inc: Include;
}): Identity[];
export declare function mapDataFromList({ inc, keyNames, identities, flatData, data, }: {
    inc: Include;
    keyNames: string[];
    identities: Identity[];
    flatData: any;
    data: any[];
}): any;
//# sourceMappingURL=mapping.d.ts.map