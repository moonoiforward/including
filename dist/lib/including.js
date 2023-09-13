"use strict";
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
exports.including = void 0;
const my_object_1 = __importDefault(require("./my-object"));
const http_client_1 = require("./http-client");
const Include_1 = require("../models/Include");
const Session_1 = require("../models/Session");
const mapping_1 = require("./mapping");
const regex_1 = require("./regex");
const my_string_1 = __importDefault(require("./my-string"));
function childrening(inc, { sessionId, flatData, keys, dimension, isBranch, }) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let result = {};
        const promises = [];
        const identities = (0, mapping_1.createIdentities)({
            keys,
            inc,
            flatData,
        });
        if (inc.each || inc.params) {
            const where = {};
            for (let identity of identities) {
                if (inc.params) {
                    inc.url = (0, mapping_1.mapParams)(inc.url, identity);
                }
                else if (inc.foreign) {
                    where[inc.foreign] = identity.value;
                }
                const promiseInclude = requestForChildren({
                    sessionId,
                    identity: identity,
                    identities: identities,
                    inc,
                    where,
                    dimension,
                    isBranch,
                });
                promises.push(promiseInclude);
            }
        }
        else {
            let identitiesValues = (0, mapping_1.mapIdentities)(identities);
            if (!inc.duplicate) {
                identitiesValues = my_object_1.default.filterDuplicate(identitiesValues);
            }
            const where = {};
            if (inc.delimiter && inc.foreign) {
                where[inc.foreign] = identitiesValues.join(inc.delimiter);
            }
            else if (inc.foreign) {
                where[inc.foreign] = identitiesValues;
            }
            else {
                where.identities = identitiesValues;
            }
            const promiseInclude = requestForChildren({
                sessionId,
                identities: identities,
                inc,
                where,
                dimension,
                isBranch,
            });
            promises.push(promiseInclude);
        }
        yield Promise.all(promises).then((resultPromises) => {
            resultPromises.forEach((mapResult) => {
                if (mapResult) {
                    result = Object.assign(Object.assign({}, result), mapResult);
                }
            });
        });
        resolve(result);
    }));
}
function requestForChildren({ sessionId, identity, identities, inc, where, dimension, isBranch, }) {
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        let flatData = {};
        const httpClient = new http_client_1.HttpClient({ sessionId: sessionId });
        let keyNames = (0, mapping_1.mapKeynameForIncludes)({
            inc,
            identities,
            identity,
            flatData,
        });
        let query;
        let body;
        let headers = Object.assign(Object.assign({}, Session_1.Session.getHeaders(sessionId)), inc.headers);
        query = (0, mapping_1.createQuery)({
            query: inc.query,
            sessionId,
        });
        body = (0, mapping_1.createQuery)({
            query: inc.body,
            sessionId,
        });
        if (["GET", "DELETE"].includes(inc.method.toLocaleUpperCase())) {
            body = null;
            query = Object.assign(Object.assign({}, where), query);
        }
        else {
            body = Object.assign(Object.assign({}, body), where);
        }
        const requestOption = {
            methid: inc.method,
            headers: inc._headers || headers,
            query: inc._query || query,
            body: inc._body || body,
            timeout: inc.timeout,
        };
        let url = (0, mapping_1.replaceUrl)(inc.url, Session_1.Session.getReplaces(sessionId));
        yield httpClient
            .request(url, requestOption)
            .then((data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (inc.onSuccess) {
                try {
                    inc.onSuccess(null, Object.assign({ url: url }, requestOption), data);
                }
                catch (error) { }
            }
            if ((_a = inc.frame) === null || _a === void 0 ? void 0 : _a.length) {
                data = {
                    [inc.frame]: data,
                };
            }
            else if (inc.isShouldHaveFrame(data)) {
                data = {
                    data: data,
                };
            }
            const key = inc.select;
            if (inc.whole || key === "_") {
            }
            else if (key === null || key === void 0 ? void 0 : key.includes(".")) {
                const keyR = key.split(".");
                for (let keyInR of keyR) {
                    if (keyInR !== "") {
                        data = data[keyInR] || null;
                    }
                }
            }
            else {
                if (key) {
                    data = data[key] || null;
                }
            }
            if (((_b = inc.includes) === null || _b === void 0 ? void 0 : _b.length) || ((_c = inc.branches) === null || _c === void 0 ? void 0 : _c.length)) {
                data = yield onSuccess({
                    inc,
                    sessionId,
                    data: data,
                    dimension: dimension + 1,
                }).catch((e) => { });
            }
            if (isBranch) {
                flatData[inc.model] = data;
                return;
            }
            if (inc.each) {
                const keyName = keyNames[0];
                flatData[keyName] = data;
            }
            else if (inc.params) {
                const keyName = keyNames[0];
                flatData[keyName] = data;
            }
            else if (data) {
                flatData = (0, mapping_1.mapDataFromList)({
                    inc,
                    keyNames,
                    identities,
                    flatData,
                    data,
                });
            }
            else {
                for (let keyName of keyNames) {
                    flatData[keyName] = data;
                }
            }
        }))
            .catch((e) => {
            if (isBranch) {
                flatData[inc.model] = {
                    error: e,
                };
            }
            else if (inc.each) {
                const keyName = keyNames[0];
                flatData[keyName] = inc.default;
            }
            else if (inc.params) {
                const keyName = keyNames[0];
                flatData[keyName] = inc.default;
            }
            else {
                for (let keyName of keyNames) {
                    flatData[keyName] = inc.default;
                }
            }
        });
        resolve(flatData);
    }));
}
function onSuccess({ sessionId, inc, data, dimension, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const isArray = Array.isArray(data);
        const promises = [];
        let flatData = my_object_1.default.flatten(data);
        const keys = Object.keys(flatData);
        if (inc.branches) {
            for (let eachBranches of inc.branches) {
                if (eachBranches.buildQuery) {
                    eachBranches._query = eachBranches.buildQuery(data);
                }
                if (eachBranches.buildBody) {
                    eachBranches._body = eachBranches.buildBody(data);
                }
                if (eachBranches.buildHeaders) {
                    eachBranches._headers = eachBranches.buildHeaders(data);
                }
                const promise = childrening(eachBranches, {
                    sessionId,
                    flatData,
                    keys,
                    dimension,
                    isBranch: true,
                });
                promises.push(promise);
            }
        }
        if (inc.includes) {
            for (let eachInc of inc.includes) {
                if (eachInc.buildQuery) {
                    eachInc._query = eachInc.buildQuery(data);
                }
                if (eachInc.buildBody) {
                    eachInc._body = eachInc.buildBody(data);
                }
                if (eachInc.buildHeaders) {
                    eachInc._headers = eachInc.buildHeaders(data);
                }
                const promise = childrening(eachInc, {
                    sessionId,
                    flatData,
                    keys,
                    dimension,
                    isBranch: false,
                });
                promises.push(promise);
            }
        }
        if (promises.length) {
            yield Promise.all(promises).then((results) => {
                results.forEach((result) => {
                    if (result) {
                        flatData = Object.assign(Object.assign({}, flatData), result);
                    }
                });
            });
        }
        if (isArray) {
            const unflatten = my_object_1.default.unflatten(flatData);
            return Object.keys(unflatten).map((key) => unflatten[key]);
        }
        return my_object_1.default.unflatten(flatData);
    });
}
function request(inc, { sessionId, }) {
    return new Promise((resolve, reject) => {
        let url = (0, mapping_1.replaceUrl)(inc.url, Session_1.Session.getReplaces(sessionId));
        const httpClient = new http_client_1.HttpClient({ sessionId: sessionId });
        const params = {
            query: inc.query,
            method: inc.method,
            headers: Object.assign(Object.assign({}, Session_1.Session.getHeaders(sessionId)), inc.headers),
            body: inc.body,
            timeout: inc.timeout,
        };
        httpClient
            .request(url, params)
            .then((data) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (inc.onSuccess) {
                try {
                    inc.onSuccess(null, Object.assign({ url: url }, params), data);
                }
                catch (error) { }
            }
            if (typeof data !== "object") {
                resolve(data);
                return;
            }
            if ((_a = inc.frame) === null || _a === void 0 ? void 0 : _a.length) {
                data = {
                    [inc.frame]: data,
                };
            }
            else if (inc.isShouldHaveFrame(data)) {
                data = {
                    data: data,
                };
            }
            if (inc.select) {
                const selectR = inc.select.split(".");
                for (let item of selectR) {
                    data = data[item];
                }
            }
            if (inc.sessions) {
                try {
                    for (let key of Object.keys(inc.sessions)) {
                        Session_1.Session.setSession(sessionId, inc.sessions[key], data[key]);
                    }
                }
                catch (error) { }
            }
            yield onSuccess({
                sessionId,
                inc,
                data,
                dimension: 1,
            })
                .then((result) => {
                data = result;
                if (inc.selects || inc.excludes) {
                    data = selectsAndExcludes(data, inc);
                }
            })
                .catch((e) => {
                data = {
                    errror: e,
                };
            });
            resolve(data);
        }))
            .catch((e) => {
            resolve({
                isError: true,
                error: e,
            });
        });
    });
}
function selectsAndExcludes(data, inc) {
    let isArray = Array.isArray(data);
    let isSelect = inc.selects ? true : false;
    let isExclude = inc.excludes ? true : false;
    let flatData = my_object_1.default.flatten(data);
    let selects = inc.selects || inc.excludes;
    let selectData = {};
    for (let key of Object.keys(flatData)) {
        const keySplit = key.split(".").filter((inKey) => {
            return (0, regex_1.isNotNumber)(inKey);
        });
        let isMatch = false;
        for (let select of selects) {
            if (select === keySplit.join(".")) {
                isMatch = true;
            }
            else if (keySplit.join(".").indexOf(select) === 0) {
                isMatch = true;
            }
        }
        if (isSelect && isMatch) {
            selectData[key] = flatData[key];
        }
        else if (isExclude && !isMatch) {
            selectData[key] = flatData[key];
        }
    }
    if (isArray) {
        const unflatten = my_object_1.default.unflatten(selectData);
        return Object.keys(unflatten).map((key) => unflatten[key]);
    }
    return my_object_1.default.unflatten(selectData);
}
function including(param) {
    return new Promise((resolveMain, rejectMain) => {
        var _a;
        const list = (_a = param.list) === null || _a === void 0 ? void 0 : _a.map((item) => Include_1.Include.fromJSON(item));
        const id = my_string_1.default.generateId();
        Session_1.Session.initSession(id, {
            headers: param.headers,
            replaces: param.replaces,
        });
        const results = {};
        const promises = [];
        for (let item of list) {
            const promise = request(item, {
                sessionId: id,
            });
            promise
                .then((data) => {
                results[item.model] = data;
                if (item.onDone) {
                    try {
                        if (data.isError) {
                            item.onDone(data.error, null);
                        }
                        else {
                            item.onDone(null, data);
                        }
                    }
                    catch (error) { }
                }
            })
                .catch((err) => {
                if (item.onDone) {
                    try {
                        item.onDone(err, null);
                    }
                    catch (error) { }
                }
                results[item.model] = {
                    errror: err,
                };
            });
            promises.push(promise);
        }
        Promise.all(promises)
            .then((_results) => __awaiter(this, void 0, void 0, function* () {
            resolveMain(results);
            if (Session_1.Session.isSaveLogs) {
                try {
                    yield Session_1.Session.writeLog(id);
                }
                catch (error) { }
            }
            Session_1.Session.clearSession(id);
        }))
            .catch((e) => { });
    });
}
exports.including = including;
