import { promises as fs } from "fs";
export class Session {
  static isSaveLogs: boolean = false;
  static data: {
    [sessionId: string]: {
      headers: any;
      session: any;
      replaces: any;
      timeout: number;
      logs: any[];
    };
  } = {};
  static setSaveLogs(isSaveLogs: boolean) {
    Session.isSaveLogs = isSaveLogs;
  }
  static insertLog(id: string, value: any) {
    Session.data[id].logs.push(value);
  }
  static getTimeout(id: string) {
    return Session.data[id].timeout;
  }
  static getLogs(id: string) {
    return Session.data[id].logs;
  }
  static getHeaders(id: string) {
    return Session.data[id].headers;
  }
  static getSessions(id: string) {
    return Session.data[id].session;
  }
  static getReplaces(id: string) {
    return Session.data[id].replaces;
  }
  static getSession(id: string, key: string) {
    return Session.data[id].session[key];
  }
  static setSession(id: string, key: string, value: any) {
    Session.data[id].session[key] = value;
  }
  static initSession(id: string, params: any) {
    const timeoutDefault = 1000 * 60 * 2;
    Session.data[id] = {
      headers: params?.headers || {},
      replaces: params?.replaces || {},
      timeout: params?.timeout || timeoutDefault,
      session: {},
      logs: [],
    };
  }
  static writeLog(id: string) {
    return fs.writeFile(
      "./logs/" + id + ".json",
      JSON.stringify(
        {
          sessions: Session.getSessions(id),
          logs: Session.getLogs(id),
        },
        null,
        4
      )
    );
  }
  static clearSession(id: string) {
    delete Session.data[id];
  }
}
