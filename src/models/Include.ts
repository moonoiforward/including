export interface IncludeInterface {
  url: string;
  model: string;
  method: string;
  timeout?: number;
  default?: string;
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
  frame?: string;
  select?: string;
  whole?: boolean;
  each?: boolean;
  pagination?: boolean;
  includes?: IncludeInterface[];
  branches?: IncludeInterface[];
  buildQuery?: (data: any) => any;
  buildBody?: (data: any) => any;
  buildHeaders?: (data: any) => any;
  onSuccess?: (err: any, client: any, data: any) => void;
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
  pagination?: boolean;
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
    this.pagination = data["pagination"] || false;
    this.duplicate = data["duplicate"] ? data["duplicate"] : true;
    this.buildHeaders = data["buildHeaders"];
    this.buildQuery = data["buildQuery"];
    this.buildBody = data["buildBody"];
    this.onSuccess = data["onSuccess"];
    this.onDone = data["onDone"];
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
