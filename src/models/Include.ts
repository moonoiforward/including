export class Include {
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

  constructor(data: any) {
    this.default = data["default"] || null;
    this.url = data["url"];
    this.method = data["method"];
    this.model = data["model"];
    this.query = data["query"];
    this.headers = data["headers"] || {};
    this.body = data["body"];
    this.params = data["params"];
    this.sessions = data["sessions"];
    this.on = data["on"];
    this.delimiter = data["delimiter"];
    this.foreign = data["foreign"];
    this.local = data["local"];
    this.select = data["select"];
    this.selects = data["selects"];
    this.excludes = data["excludes"];
    this.whole = data["whole"] || false;
    this.pagination = data["pagination"] || false;
    this.duplicate = data["duplicate"] ? data["duplicate"] : true;
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
}

// export class Load {
//   url: string;
//   model: string;
//   query: any;
//   select: string;
//   headers: any;
//   body: any;
//   sessions: any;
//   branches: Include[];
//   includes: Include[];

//   constructor(data: any) {
//     this.url = data["url"];
//     this.model = data["model"];
//     this.query = data["query"];
//     this.select = data["select"];
//     this.sessions = data["sessions"];
//     this.headers = data["headers"];
//     this.body = data["body"];
//     if (data["includes"]) {
//       this.includes = data["includes"].map((item: any) =>
//         Include.fromJSON(item)
//       );
//     } else {
//       this.includes = [];
//     }
//     if (data["branches"]) {
//       this.branches = data["branches"].map((item: any) =>
//         Include.fromJSON(item)
//       );
//     } else {
//       this.branches = [];
//     }
//   }

//   static fromJSON(data: any) {
//     return new Load(data);
//   }
// }
