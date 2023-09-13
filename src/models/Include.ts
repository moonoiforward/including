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
   * Property of data for processing in the next step.
   * not like selects: string[]
   * the select will work before process including
   */
  select?: string;

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

export class Include implements IncludeInterface {
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
  select?: string;
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
  constructor(data: any) {
    this.url = data["url"];
    this.method = data["method"];
    this.model = data["model"];
    this.timeout = data["timeout"];
    this.default = data["default"] || null;
    this.query = data["query"];
    this.headers = data["headers"] || {};
    this.body = data["body"];
    this.params = data["params"];
    this.sessions = data["sessions"];
    this.on = data["on"];
    this.delimiter = data["delimiter"];
    this.foreign = data["foreign"];
    this.local = data["local"];
    this.frame = data["frame"];
    this.select = data["select"];
    this.selects = data["selects"];
    this.excludes = data["excludes"];
    this.whole = data["whole"] || false;
    this.duplicate = data["duplicate"] ? data["duplicate"] : true;
    this.buildHeaders = data["buildHeaders"];
    this.buildQuery = data["buildQuery"];
    this.buildBody = data["buildBody"];
    this.onSuccess = data["onSuccess"];
    this.onDone = data["onDone"];
    if (
      typeof data["duplicate"] !== "undefined" &&
      data["duplicate"] !== null
    ) {
      this.duplicate = data["duplicate"];
    } else {
      this.duplicate = true;
    }
    if (typeof data["each"] !== "undefined" && data["each"] !== null) {
      this.each = data["each"];
    } else if (typeof data["many"] !== "undefined" && data["many"] !== null) {
      this.each = data["many"];
    } else {
      this.each = false;
    }
    if (data["includes"]) {
      this.includes = data["includes"].map((item: any) =>
        Include.fromJSON(item)
      );
    } else {
      this.includes = [];
    }
    if (data["branches"]) {
      this.branches = data["branches"].map((item: any) =>
        Include.fromJSON(item)
      );
    } else {
      this.branches = [];
    }
  }

  static fromJSON(data: any) {
    return new Include(data);
  }

  public isShouldHaveFrame(data: any): boolean {
    const bool: boolean =
      Array.isArray(data) &&
      this.frame?.length === 0 &&
      this.branches!!.length > 0;
    return bool;
  }
}
