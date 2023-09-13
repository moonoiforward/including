import moment from "moment";
import MyObject from "./my-object";
import Random from "./random";
import { HttpClient } from "./http-client";
import { Identity } from "../models/Identity";
import { Include } from "../models/Include";
import { Session } from "../models/Session";
import {
  createIdentities,
  createQuery,
  mapDataFromList,
  mapIdentities,
  mapKeynameForIncludes,
  mapParams,
  replaceUrl,
} from "./mapping";
import { isNotNumber } from "./regex";
function childrening(
  inc: Include,
  {
    sessionId,
    flatData,
    keys,
    dimension,
    isBranch,
  }: {
    sessionId: string;
    keys: string[];
    flatData: any;
    dimension: number;
    isBranch: boolean;
  }
) {
  return new Promise(async (resolve, reject) => {
    let result = {};
    const promises: Promise<any>[] = [];
    const identities = createIdentities({
      keys,
      inc,
      flatData,
    });
    if (inc.each || inc.params) {
      const where: any = {};
      for (let identity of identities) {
        if (inc.params) {
          inc.url = mapParams(inc.url, identity);
        } else if (inc.foreign) {
          where[inc.foreign] = identity.value;
        }
        const promiseInclude = requestForInclude({
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
    } else {
      let identitiesValues = mapIdentities(identities);
      if  (!inc.duplicate) {
        identitiesValues = MyObject.filterDuplicate(identitiesValues);
      }
      const where: any = {};
      if (inc.delimiter && inc.foreign) {
        where[inc.foreign] = identitiesValues.join(inc.delimiter);
      } else if (inc.foreign) {
        where[inc.foreign] = identitiesValues;
      } else {
        where.identities = identitiesValues;
      }
      const promiseInclude = requestForInclude({
        sessionId,
        identities: identities,
        inc,
        where,
        dimension,
        isBranch,
      });
      promises.push(promiseInclude);
    }

    await Promise.all(promises).then((resultPromises) => {
      resultPromises.forEach((mapResult) => {
        if (mapResult) {
          result = {
            ...result,
            ...mapResult,
          };
        }
      });
    });
    resolve(result);
  });
}

function requestForInclude({
  sessionId,
  identity,
  identities,
  inc,
  where,
  dimension,
  isBranch,
}: {
  sessionId: string;
  isBranch: boolean;
  identity?: Identity;
  identities: Identity[];
  inc: Include;
  where: any;
  dimension: number;
}) {
  return new Promise(async (resolve) => {
    let flatData: any = {};
    const httpClient = new HttpClient({ sessionId: sessionId });
    let keyNames = mapKeynameForIncludes({
      inc,
      identities,
      identity,
      flatData,
    });
    let query: any;
    let body: any;
    query = createQuery({
      query: inc.query,
      sessionId,
    });
    body = createQuery({
      query: inc.body,
      sessionId,
    });
    if (["GET", "DELETE"].includes(inc.method.toLocaleUpperCase())) {
      body = null;
      query = {
        ...where,
        ...query,
      };
    } else {
      body = {
        ...body,
        ...where,
      };
    }
    const requestOption = {
      methid: inc.method,
      query: query,
      body: body,
      headers: {
        ...Session.getHeaders(sessionId),
        ...inc.headers,
      },
    };
    let url = replaceUrl(inc.url, Session.getReplaces(sessionId));
    await httpClient
      .request(url, requestOption)
      .then(async (data: any) => {
        const key = inc.select;
        if (inc.whole || key === "_") {
        } else if (key?.includes(".")) {
          const keyR = key.split(".");
          for (let keyInR of keyR) {
            if (keyInR !== "") {
              data = data[keyInR] || null;
            }
          }
        } else {
          if (key) {
            data = data[key] || null;
          }
        }
        if (inc.includes?.length || inc.branches?.length) {
          data = await onSuccess({
            inc,
            sessionId,
            data: data,
            dimension: dimension + 1,
          }).catch((e) => {});
        }

        if (isBranch) {
          flatData[inc.model] = data;
          return;
        }
        if (inc.each) {
          const keyName = keyNames[0];
          flatData[keyName] = data;
        } else if (inc.params) {
          const keyName = keyNames[0];
          flatData[keyName] = data;
        } else if (data) {
          flatData = mapDataFromList({
            inc,
            keyNames,
            identities,
            flatData,
            data,
          });
        } else {
          for (let keyName of keyNames) {
            flatData[keyName] = data;
          }
        }
      })
      .catch((e) => {
        if (isBranch) {
          flatData[inc.model] = {
            error: e,
          };
        } else if (inc.each) {
          const keyName = keyNames[0];
          flatData[keyName] = inc.default;
        } else if (inc.params) {
          const keyName = keyNames[0];
          flatData[keyName] = inc.default;
        } else {
          for (let keyName of keyNames) {
            flatData[keyName] = inc.default;
          }
        }
      });
    resolve(flatData);
  });
}
async function onSuccess({
  sessionId,
  inc,
  data,
  dimension,
}: {
  sessionId: string;
  inc: Include;
  data: any;
  dimension: number;
}) {
  const isArray = Array.isArray(data);
  const promises: Promise<any>[] = [];
  let flatData = MyObject.flatten(data);
  const keys = Object.keys(flatData);
  if (inc.branches!!) {
    for (let eachBranches of inc.branches) {
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
  if (inc.includes!!) {
    for (let eachInc of inc.includes) {
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
    await Promise.all(promises).then((results) => {
      results.forEach((result) => {
        if (result) {
          flatData = {
            ...flatData,
            ...result,
          };
        }
      });
    });
  }
  if (isArray) {
    const unflatten: any = MyObject.unflatten(flatData);
    return Object.keys(unflatten).map((key) => unflatten[key]);
  }
  return MyObject.unflatten(flatData);
}
function request(
  inc: Include,
  {
    sessionId,
  }: {
    sessionId: string;
  }
) {
  return new Promise((resolve, reject) => {
    let url = replaceUrl(inc.url, Session.getReplaces(sessionId));
    const httpClient = new HttpClient({ sessionId: sessionId });
    httpClient
      .request(url, {
        query: inc.query,
        method: inc.method,
        headers: {
          ...Session.getHeaders(sessionId),
          ...inc.headers,
        },
        body: inc.body,
      })
      .then(async (data: any) => {
        if (typeof data !== "object") {
          resolve(data);
          return;
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
              Session.setSession(sessionId, inc.sessions[key], data[key]);
            }
          } catch (error) {}
        }
        await onSuccess({
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
      })
      .catch((e) => {
        resolve({
          error: e,
        });
      });
  });
}
function selectsAndExcludes(data: any, inc: Include) {
  let isArray = Array.isArray(data);
  let isSelect = inc.selects ? true : false;
  let isExclude = inc.excludes ? true : false;
  let flatData = MyObject.flatten(data);
  let selects = inc.selects || inc.excludes;
  let selectData: any = {};
  for (let key of Object.keys(flatData)) {
    const keySplit = key.split(".").filter((inKey) => {
      return isNotNumber(inKey);
    });
    let isMatch = false;
    for (let select of selects!!) {
      if (select === keySplit.join(".")) {
        isMatch = true;
      } else if (keySplit.join(".").indexOf(select) === 0) {
        isMatch = true;
      }
    }
    if (isSelect && isMatch) {
      selectData[key] = flatData[key];
    } else if (isExclude && !isMatch) {
      selectData[key] = flatData[key];
    }
  }

  if (isArray) {
    const unflatten: any = MyObject.unflatten(selectData);
    return Object.keys(unflatten).map((key) => unflatten[key]);
  }
  return MyObject.unflatten(selectData);
}

export interface IIncludingParam {
  replaces?: any;
  headers?: any;
  list: Include[];
}
export function including(param: IIncludingParam) {
  return new Promise((resolveMain, rejectMain) => {
    const list = param.list;
    const id = moment().unix() + "_" + Random.stringWithNumber(5);
    Session.initSession(id, {
      headers: param.headers,
      replaces: param.replaces,
    });
    const results: any = {};
    const promises = [];
    for (let item of list) {
      const promise = request(item, {
        sessionId: id,
      });
      promise
        .then((data) => {
          results[item.model] = data;
        })
        .catch((err) => {
          results[item.model] = {
            errror: err,
          };
        });
      promises.push(promise);
    }
    Promise.all(promises)
      .then(async (_results) => {
        resolveMain(results);
        if (Session.isSaveLogs) {
          try {
            await Session.writeLog(id);
          } catch (error) {}
        }
        Session.clearSession(id);
      })
      .catch((e) => {});
  });
}
