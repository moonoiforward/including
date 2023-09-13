import MyObject from "./my-object";
import { HttpClient } from "./http-client";
import { Identity } from "../models/Identity";
import { Include, IncludeInterface } from "../models/Include";
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
import MyString from "./my-string";
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
    } else {
      let identitiesValues = mapIdentities(identities);
      if (!inc.duplicate) {
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

function requestForChildren({
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
    let headers: any = {
      ...Session.getHeaders(sessionId),
      ...inc.headers,
    };
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
      headers: inc._headers || headers,
      query: inc._query || query,
      body: inc._body || body,
      timeout: inc.timeout,
    };
    let url = replaceUrl(inc.url, Session.getReplaces(sessionId));
    await httpClient
      .request(url, requestOption)
      .then(async (data: any) => {
        if (inc.onSuccess) {
          try {
            inc.onSuccess(
              null,
              {
                url: url,
                ...requestOption,
              },
              data
            );
          } catch (error) {}
        }
        if (inc.frame?.length) {
          data = {
            [inc.frame]: data,
          };
        } else if (inc.isShouldHaveFrame(data)) {
          data = {
            data: data,
          };
        }
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
        if (inc.selects || inc.excludes) {
          data = selectsAndExcludes(data, inc);
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
  if (inc.includes!!) {
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
    const params = {
      query: inc.query,
      method: inc.method,
      headers: {
        ...Session.getHeaders(sessionId),
        ...inc.headers,
      },
      body: inc.body,
      timeout: inc.timeout,
    };
    httpClient
      .request(url, params)
      .then(async (data: any) => {
        if (inc.onSuccess) {
          try {
            inc.onSuccess(
              null,
              {
                url: url,
                ...params,
              },
              data
            );
          } catch (error) {}
        }
        if (typeof data !== "object") {
          resolve(data);
          return;
        }
        if (inc.frame?.length) {
          data = {
            [inc.frame]: data,
          };
        } else if (inc.isShouldHaveFrame(data)) {
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
          isError: true,
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
  list: IncludeInterface[];
}
export function including(param: IIncludingParam) {
  return new Promise((resolveMain, rejectMain) => {
    const list: Include[] = param.list?.map((item) => Include.fromJSON(item));
    const id = MyString.generateId();
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
        .then((data: any) => {
          results[item.model] = data;
          if (item.onDone) {
            try {
              if (data.isError) {
                item.onDone(data.error, null);
              } else {
                item.onDone(null, data);
              }
            } catch (error) {}
          }
        })
        .catch((err) => {
          if (item.onDone) {
            try {
              item.onDone(err, null);
            } catch (error) {}
          }
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
