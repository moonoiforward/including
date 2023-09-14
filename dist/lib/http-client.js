"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const ObjectQueryString = __importStar(require("object-query-string"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const models_1 = require("../models");
class HttpClient {
    constructor(params) {
        if (params === null || params === void 0 ? void 0 : params.sessionId) {
            this.sessionId = params.sessionId;
        }
    }
    request(url, params) {
        return new Promise((resolve, reject) => {
            params = Object.assign({}, params);
            if (params.query) {
                const stringifyURL = ObjectQueryString.queryString(params.query);
                if (stringifyURL && stringifyURL != "") {
                    url += "?" + stringifyURL;
                }
                delete params.query;
            }
            if (this.sessionId) {
                models_1.Session.insertLog(this.sessionId, Object.assign({ url: url }, params));
            }
            (0, node_fetch_1.default)(url, params)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                const buff = yield res.arrayBuffer().then(Buffer.from);
                if (res.status > 201) {
                    reject({
                        status: res.status,
                        error: buff.toString(),
                    });
                    return;
                }
                try {
                    resolve(JSON.parse(buff.toString()));
                }
                catch (err) {
                    resolve(buff.toString());
                }
            }))
                .catch((e) => {
                reject({
                    status: e.code,
                    message: e.message,
                    stack: e.stack,
                });
            });
        });
    }
}
exports.HttpClient = HttpClient;
