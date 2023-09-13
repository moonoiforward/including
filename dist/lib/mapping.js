"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDataFromList = exports.createIdentities = exports.mapKeynameForIncludes = exports.mapIdentities = exports.createQuery = exports.mapParams = exports.replaceUrl = void 0;
const Session_1 = require("../models/Session");
const regex_1 = require("./regex");
function replaceUrl(url, replaces) {
    Object.keys(replaces).forEach((key) => {
        url = url.replace(key, replaces[key]);
    });
    return url;
}
exports.replaceUrl = replaceUrl;
function mapParams(item, identity) {
    const urlR = item.split("/");
    let index = 0;
    urlR.forEach((element, i) => {
        if (element.includes("$")) {
            if (identity.params[index]) {
                urlR[i] = identity.params[index];
                index++;
            }
        }
    });
    return urlR.join("/");
}
exports.mapParams = mapParams;
function createQuery({ query, sessionId, }) {
    if (query) {
        Object.keys(query).forEach((key) => {
            if (typeof query[key] === "string") {
                let str = query[key];
                if (str.indexOf("$") === 0) {
                    str = str.replace("$", "");
                    query[key] = Session_1.Session.getSession(sessionId, str);
                }
            }
        });
        return query;
    }
    else {
        return {};
    }
}
exports.createQuery = createQuery;
function mapIdentities(identities) {
    const identitiesValues = [];
    for (let inIdentities of identities) {
        if (!inIdentities.value) {
            continue;
        }
        if (typeof inIdentities.value === "object") {
            for (let inIdentity of inIdentities.value) {
                identitiesValues.push(inIdentity);
            }
        }
        else {
            identitiesValues.push(inIdentities.value);
        }
    }
    return identitiesValues;
}
exports.mapIdentities = mapIdentities;
/**
 * create key by inc.on for build query/body api
 * @param param0
 * @returns
 */
function mapKeynameForIncludes({ inc, identity, flatData, identities, }) {
    const keyNames = [];
    if (identity) {
        let keyNameList = identity.key.split(".");
        let keyName = "";
        if (keyNameList.length > 1) {
            keyNameList.pop();
            const last = keyNameList[keyNameList.length - 1];
            if ((0, regex_1.isNotNumber)(last)) {
                keyNameList.pop();
            }
            if (keyNameList.length) {
                keyName = keyNameList.join(".") + "." + inc.model;
            }
            else {
                keyName = inc.model;
            }
        }
        else {
            keyName = inc.model;
        }
        keyNames.push(keyName);
        delete flatData[keyName];
    }
    else {
        for (let id of identities) {
            let keyNameList = id.key.split(".");
            let keyName = "";
            if (keyNameList.length > 1) {
                keyNameList.pop();
                keyName = keyNameList.join(".") + "." + inc.model;
            }
            else {
                keyName = inc.model;
            }
            keyNames.push(keyName);
            delete flatData[keyName];
        }
    }
    return keyNames;
}
exports.mapKeynameForIncludes = mapKeynameForIncludes;
function createIdentities({ inc, keys, flatData, }) {
    const identities = [];
    if (inc.on) {
        const onSplit = inc.on.split(".");
        if (onSplit.length >= 1) {
            for (let key of keys) {
                const keySplit = key.split(".").filter((inKey) => {
                    return (0, regex_1.isNotNumber)(inKey);
                });
                if (keySplit.join("-") === onSplit.join("-")) {
                    identities.push({
                        key: key,
                        value: flatData[key],
                        params: [],
                    });
                }
            }
        }
    }
    else if (inc.params) {
        const params = inc.params;
        const filterKeys = keys.filter((key) => {
            const keySplit = key.split(".").filter((inKey) => {
                return (0, regex_1.isNotNumber)(inKey);
            });
            const findInParams = params.find((param) => param === keySplit.join("."));
            return findInParams;
        });
        const sameItem = {};
        for (let key of filterKeys) {
            const lengthList = params.map((param) => param.split(".").length);
            const min = Math.min.apply(null, lengthList);
            const keySplit = key.split(".");
            const keyForSame = keySplit.slice(0, min).join(".");
            if (!sameItem[keyForSame]) {
                sameItem[keyForSame] = [];
            }
            sameItem[keyForSame].push({
                key: key,
                value: flatData[key],
            });
        }
        Object.keys(sameItem).forEach((key) => {
            if (sameItem[key].length < params.length) {
                delete sameItem[key];
            }
        });
        Object.keys(sameItem).forEach((key) => {
            var _a;
            const item = sameItem[key];
            const values = [];
            (_a = inc.params) === null || _a === void 0 ? void 0 : _a.forEach((param) => {
                const paramR = param.split(".");
                const lastest = paramR[paramR.length - 1];
                const find = item.find((inItem) => inItem.key.includes(lastest));
                values.push(find.value);
            });
            identities.push({
                key: key + "." + inc.model,
                value: null,
                // params: sameItem[key].map(same => same.value)
                params: values,
            });
        });
    }
    return identities;
}
exports.createIdentities = createIdentities;
function mapDataFromList({ inc, keyNames, identities, flatData, data, }) {
    let i = 0;
    const keyMap = inc.local;
    for (let id of identities) {
        const keyName = keyNames[i];
        if (!id.value) {
            flatData[keyName] = null;
            i++;
            continue;
        }
        if (typeof id.value === "object") {
            const filter = data.filter((inList) => {
                const find = id.value.find((inValue) => {
                    if (keyMap)
                        return inValue.toString() === inList[keyMap].toString();
                    return Object.keys(inList).find((keyInList) => inList[keyInList].toString() === inValue.toString());
                });
                return find;
            });
            flatData[keyName] = filter;
            i++;
            continue;
        }
        else {
            let includeData = null;
            includeData = data.find((inList) => {
                if (keyMap)
                    return inList[keyMap].toString() === id.value.toString();
                return Object.keys(inList).find((keyInList) => inList[keyInList].toString() === id.value.toString());
            });
            flatData[keyName] = includeData || null;
            i++;
            continue;
        }
    }
    return flatData;
}
exports.mapDataFromList = mapDataFromList;
