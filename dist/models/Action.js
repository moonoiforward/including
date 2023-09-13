"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = void 0;
class Action {
    constructor(data) {
        this.url = data["url"];
        this.model = data["model"];
        this.query = data["query"];
        this.select = data["select"];
        this.method = data["method"];
        this.body = data["body"];
        this.sessions = data["sessions"];
        this.headers = data["headers"];
        if (data["then"]) {
            this.then = data["then"].map((item) => {
                return Action.fromJSON(item);
            });
        }
        else {
            this.then = [];
        }
    }
    static fromJSON(data) {
        return new Action(data);
    }
}
exports.Action = Action;
