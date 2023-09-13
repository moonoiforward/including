"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const random_1 = __importDefault(require("./random"));
class MyString {
    static generateId() {
        return Date.now() + "_" + random_1.default.stringWithNumber(5);
    }
}
exports.default = MyString;
