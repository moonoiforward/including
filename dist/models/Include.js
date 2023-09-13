"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Include = void 0;
class Include {
    constructor(data) {
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
        }
        else if (typeof data["many"] !== "undefined" && data["many"] !== null) {
            this.each = data["many"];
        }
        else {
            this.each = false;
        }
        if (data["includes"]) {
            this.includes = data["includes"].map((item) => Include.fromJSON(item));
        }
        else {
            this.includes = [];
        }
        if (data["branches"]) {
            this.branches = data["branches"].map((item) => Include.fromJSON(item));
        }
        else {
            this.branches = [];
        }
    }
    static fromJSON(data) {
        return new Include(data);
    }
}
exports.Include = Include;
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
