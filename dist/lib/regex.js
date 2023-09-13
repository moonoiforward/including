"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotNumber = exports.isNumber = void 0;
function isNumber(str) {
    return /^\d+$/.test(str);
}
exports.isNumber = isNumber;
function isNotNumber(str) {
    return !/^\d+$/.test(str);
}
exports.isNotNumber = isNotNumber;
