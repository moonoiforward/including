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
Object.defineProperty(exports, "__esModule", { value: true });
const flat = __importStar(require("flat"));
const regex_1 = require("./regex");
class MyObject {
    static filterDuplicate(arr) {
        return arr.filter(function (item, pos) {
            return arr.indexOf(item) == pos;
        });
    }
    static unflatten(data) {
        return flat.unflatten(data);
    }
    static flatten(data) {
        let flatData = flat.flatten(data);
        /**
         * if deepest is array make to array
         */
        Object.keys(flatData).forEach((key) => {
            const keySplit = key.split(".");
            if (keySplit.length > 1) {
                const last = keySplit[keySplit.length - 1];
                if ((0, regex_1.isNumber)(last)) {
                    keySplit.pop();
                    const keyForArray = keySplit.join(".");
                    if (flatData[keyForArray]) {
                        flatData[keyForArray].push(flatData[key]);
                    }
                    else {
                        flatData[keyForArray] = [flatData[key]];
                    }
                    delete flatData[key];
                }
            }
        });
        return flatData;
    }
}
exports.default = MyObject;
