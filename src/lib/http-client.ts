import fetch, { Response, FetchError } from "node-fetch";
import * as ObjectQueryString from "object-query-string";
import { Session } from "../models";
interface RequestOption {
  body?: any;
  headers?: any;
  method?: string;
  query?: any;
}
export class HttpClient {
  sessionId?: string;
  constructor(params?: { sessionId: string }) {
    if (params?.sessionId) {
      this.sessionId = params.sessionId;
    }
  }
  request(url: string, params: RequestOption) {
    return new Promise((resolve, reject) => {
      if (params.query) {
        const stringifyURL = ObjectQueryString.queryString(params.query);
        if (stringifyURL && stringifyURL != "") {
          url += "?" + stringifyURL;
        }
        delete params.query;
      }
      if (this.sessionId) {
        Session.insertLog(this.sessionId, {
          url: url,
          ...params,
        });
      }
      fetch(url, params)
        .then(async (res: Response) => {
          const buff = await res.arrayBuffer().then(Buffer.from);
          if (res.status > 201) {
            reject({
              status: res.status,
              data: buff.toString(),
            });
            return;
          }
          try {
            resolve(JSON.parse(buff.toString()));
          } catch (err) {
            resolve(buff.toString());
          }
        })
        .catch((e: FetchError) => {
          resolve({
            status: e.code,
            error: e.message,
          });
        });
    });
  }
}
