export interface IncludeInterface {
    /**
     * URL for making an HTTP request.
     */
    url: string;
    /**
     * Name of the result model for the HTTP request.
     */
    model: string;
    /**
     * HTTP method to be used for the request (GET, POST, PUT, PATCH, DELETE).
     */
    method: string;
    /**
     * Timeout for the HTTP request (optional).
     */
    timeout?: number;
    /**
     * Default value for the result on error (optional).
     */
    default?: string;
    /**
     * Starter query parameters for the HTTP request (optional).
     */
    query?: any;
    /**
     * Starter headers for the HTTP request (optional).
     */
    headers?: any;
    /**
     * Starter body for the HTTP request (optional).
     */
    body?: any;
    /**
     * Sessions object for defined session store values for use by children.
     * Example sessions: { userId: _userId } and in query: { userId: $_userId }
     */
    sessions?: any;
    /**
     * Property of data location in HTTP result for processing in the next step.
     * not like selects: string[]
     * the at will work before process including
     */
    at?: string;
    /**
     * Properties to select after finishing the processing (do not use together with excludes).\
     * work on last proccess
     */
    selects?: string[];
    /**
     * Properties to exclude after finishing the processing (do not use together with selects).
     */
    excludes?: string[];
    /**
     * Properties to be retrieved from parent data and replaced in the URL using "$".
     * Example: url: "https://example.com/users/$1", params: ["users"]
     */
    params?: string[];
    /**
     * Properties to retrieve from parent data to build the query or body for children requests.
     * Example: take 'userId' from parent to children query on 'id' like ?id=x or ?id[]=x&id[]=y
     * and mapping by parent.userId == children.id
       {
            on: 'userId',
            foreign: 'id',
            local: 'id'
        }
     */
    on?: string;
    /**
     * Boolean to allow duplicate values from 'on'.
     */
    duplicate?: boolean;
    /**
     * Get the whole result.
     */
    whole?: boolean;
    /**
     * Make children requests for each value of the parent identity (if applicable).
     */
    each?: boolean;
    /**
     * Change the query identity type from an array to a string join (e.g., id[]=1&id[]=2 to id=1,2).
     */
    delimiter?: string;
    /**
     * Query string property for the query identity.
     */
    foreign?: string;
    /**
     * Property from children results for mapping with 'on' from the parent.
     */
    local?: string;
    /**
     * Cover data with a frame value.
     */
    frame?: string;
    /**
     * Nested includes for recursive processing.
     */
    includes?: IncludeInterface[];
    /**
     * Nested branches for branching logic.
     */
    branches?: IncludeInterface[];
    /**
     * Function to build the query based on data.
     */
    buildQuery?: (data: any) => any;
    /**
     * Function to build the body based on data.
     */
    buildBody?: (data: any) => any;
    /**
     * Function to build headers based on data.
     */
    buildHeaders?: (data: any) => any;
    /**
     * Callback function executed on a successful request.
     */
    onSuccess?: (err: any, client: any, data: any) => void;
    /**
     * Callback function executed when the request is done, regardless of success or failure.
     */
    onDone?: (err: any, data: any) => void;
}
export declare class Include implements IncludeInterface {
    url: string;
    model: string;
    method: string;
    timeout?: number;
    default?: string;
    headers?: any;
    query?: any;
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
    frame?: string;
    at?: string;
    whole?: boolean;
    each?: boolean;
    includes?: Include[];
    branches?: Include[];
    _headers?: any;
    _query?: any;
    _body?: any;
    buildQuery?: (data: any) => any;
    buildBody?: (data: any) => any;
    buildHeaders?: (data: any) => any;
    onSuccess?: (err: any, client: any, data: any) => void;
    onDone?: (err: any, data: any) => void;
    constructor(data: any);
    static fromJSON(data: any): Include;
    isShouldHaveFrame(data: any): boolean;
}
//# sourceMappingURL=Include.d.ts.map