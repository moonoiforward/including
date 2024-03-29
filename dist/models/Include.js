"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Include = void 0;
class Include {
    constructor(data) {
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
        this.at = data["at"] || data["select"];
        this.selects = data["selects"];
        this.excludes = data["excludes"];
        this.whole = data["whole"] || false;
        this.duplicate = data["duplicate"] ? data["duplicate"] : true;
        this.buildHeaders = data["buildHeaders"];
        this.buildQuery = data["buildQuery"];
        this.buildBody = data["buildBody"];
        this.onSuccess = data["onSuccess"];
        this.onDone = data["onDone"];
        if (typeof data["duplicate"] !== "undefined" &&
            data["duplicate"] !== null) {
            this.duplicate = data["duplicate"];
        }
        else {
            this.duplicate = true;
        }
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
    isShouldHaveFrame(data) {
        var _a;
        const bool = Array.isArray(data) &&
            (!this.frame || ((_a = this.frame) === null || _a === void 0 ? void 0 : _a.length) === 0) &&
            this.branches.length > 0;
        return bool;
    }
    static buildIncludeQueryList(params) {
        const include = Include.fromJSON({
            url: params.requestTo,
            method: params.methodIs,
            model: params.modelName,
            header: params.headerIs,
            query: params.headerIs,
            body: params.headerIs,
            at: params.dataAt,
            on: params.valueFrom,
            foreign: params.sendName,
            local: params.mappingBy,
            duplicate: params.isDuplicate,
            selects: params.selectFields,
            excludes: params.excludeFields,
        });
        return include;
    }
    static buildIncludeQueryEachByParams(params) {
        const include = Include.fromJSON({
            url: params.requestTo,
            method: params.methodIs,
            model: params.modelName,
            header: params.headerIs,
            query: params.headerIs,
            body: params.headerIs,
            at: params.dataAt,
            params: params.paramsFrom,
            foreign: params.sendName,
            selects: params.selectFields,
            excludes: params.excludeFields,
        });
        return include;
    }
    static buildIncludeQueryEach(params) {
        const include = Include.fromJSON({
            url: params.requestTo,
            method: params.methodIs,
            model: params.modelName,
            header: params.headerIs,
            query: params.headerIs,
            body: params.headerIs,
            at: params.dataAt,
            on: params.valueFrom,
            foreign: params.sendName,
            each: true,
            selects: params.selectFields,
            excludes: params.excludeFields,
        });
        return include;
    }
    copyWith(obj) {
        const newInc = new Include(this);
        Object.assign(newInc, obj);
        return newInc;
    }
}
exports.Include = Include;
