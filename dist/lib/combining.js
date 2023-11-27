"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combining = void 0;
const models_1 = require("../models");
const including_1 = require("./including");
const my_string_1 = __importDefault(require("./my-string"));
/**
 * Including data by starting data
 * @param include IncludeInterface
 * @returns data after combined
 */
function combining(data, param) {
    const id = my_string_1.default.generateId();
    models_1.Session.initSession(id, {
        headers: param.headers,
        replaces: param.replaces,
        timeout: param.timeout,
    });
    return (0, including_1.onSuccess)({
        sessionId: id,
        data: data,
        inc: new models_1.Include({
            includes: param.includes,
        }),
        dimension: 1,
    });
}
exports.combining = combining;
