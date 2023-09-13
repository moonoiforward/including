"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const fs_1 = require("fs");
class Session {
    static setSaveLogs(isSaveLogs) {
        Session.isSaveLogs = isSaveLogs;
    }
    static insertLog(id, value) {
        Session.data[id].logs.push(value);
    }
    static getLogs(id) {
        return Session.data[id].logs;
    }
    static getHeaders(id) {
        return Session.data[id].headers;
    }
    static getSessions(id) {
        return Session.data[id].session;
    }
    static getReplaces(id) {
        return Session.data[id].replaces;
    }
    static getSession(id, key) {
        return Session.data[id].session[key];
    }
    static setSession(id, key, value) {
        Session.data[id].session[key] = value;
    }
    static initSession(id, params) {
        Session.data[id] = {
            headers: (params === null || params === void 0 ? void 0 : params.headers) || {},
            replaces: (params === null || params === void 0 ? void 0 : params.replaces) || {},
            session: {},
            logs: [],
        };
    }
    static writeLog(id) {
        return fs_1.promises.writeFile("./logs/" + id + ".json", JSON.stringify({
            sessions: Session.getSessions(id),
            logs: Session.getLogs(id),
        }));
    }
    static clearSession(id) {
        delete Session.data[id];
    }
}
exports.Session = Session;
Session.isSaveLogs = false;
Session.data = {};
