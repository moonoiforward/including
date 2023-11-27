import { Include, IncludeInterface, Session } from "../models";
import { onSuccess } from "./including";
import MyString from "./my-string";

/**
 * Including data by starting data
 * @param include IncludeInterface
 * @returns data after combined
 */
export function combining(
  data: any,
  param: {
    headers?: any;
    replaces?: any;
    timeout?: number;
    includes: IncludeInterface[];
  }
) {
  const id = MyString.generateId();
  Session.initSession(id, {
    headers: param.headers,
    replaces: param.replaces,
    timeout: param.timeout,
  });
  return onSuccess({
    sessionId: id,
    data: data,
    inc: new Include({
      includes: param.includes,
    }),
    dimension: 1,
  });
}
