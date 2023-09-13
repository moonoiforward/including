import { Identity } from '../models/Identity';
import { Include } from '../models/Include';
import { isNotNumber } from './regex';
import { Session } from '../models/Session';
export function replaceUrl(url: string, replaces: any) {
  Object.keys(replaces).forEach((key) => {
    url = url.replace(key, replaces[key]);
  });
  return url;
}
export function mapParams(item: string, identity: any) {
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

export function createQuery({
  query,
  sessionId,
}: {
  query: any;
  sessionId: string;
}): any {
  if (query) {
    Object.keys(query).forEach((key) => {
      if (typeof query[key] === "string") {
        let str: string = query[key];
        if (str.indexOf("$") === 0) {
          str = str.replace("$", "");
          query[key] = Session.getSession(sessionId, str);
        }
      }
    });
    return query;
  } else {
    return {};
  }
}
export function mapIdentities(identities: Identity[]) {
  const identitiesValues = [];
  for (let inIdentities of identities) {
    if (!inIdentities.value) {
      continue;
    }
    if (typeof inIdentities.value === "object") {
      for (let inIdentity of inIdentities.value) {
        identitiesValues.push(inIdentity);
      }
    } else {
      identitiesValues.push(inIdentities.value);
    }
  }
  return identitiesValues;
}

/**
 * create key by inc.on for build query/body api
 * @param param0
 * @returns
 */
export function mapKeynameForIncludes({
  inc,
  identity,
  flatData,
  identities,
}: {
  flatData: any;
  identity?: Identity;
  identities: any[];
  inc: Include;
}) {
  const keyNames = [];
  if (identity) {
    let keyNameList = identity.key.split(".");
    let keyName = "";

    if (keyNameList.length > 1) {
      keyNameList.pop();
      const last = keyNameList[keyNameList.length - 1];
      if (isNotNumber(last)) {
        keyNameList.pop();
      }
      if (keyNameList.length) {
        keyName = keyNameList.join(".") + "." + inc.model;
      } else {
        keyName = inc.model;
      }
    } else {
      keyName = inc.model;
    }
    keyNames.push(keyName);
    delete flatData[keyName];
  } else {
    for (let id of identities) {
      let keyNameList = id.key.split(".");
      let keyName = "";
      if (keyNameList.length > 1) {
        keyNameList.pop();
        keyName = keyNameList.join(".") + "." + inc.model;
      } else {
        keyName = inc.model;
      }
      keyNames.push(keyName);
      delete flatData[keyName];
    }
  }
  return keyNames;
}
export function createIdentities({
  inc,
  keys,
  flatData,
}: {
  flatData: any;
  keys: string[];
  inc: Include;
}): Identity[] {
  const identities: Identity[] = [];
  if (inc.on) {
    const onSplit = inc.on.split(".");
    if (onSplit.length >= 1) {
      for (let key of keys) {
        const keySplit = key.split(".").filter((inKey) => {
          return isNotNumber(inKey);
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
  } else if (inc.params) {
    const params = inc.params;
    const filterKeys = keys.filter((key) => {
      const keySplit = key.split(".").filter((inKey) => {
        return isNotNumber(inKey);
      });
      const findInParams = params.find((param) => param === keySplit.join("."));
      return findInParams;
    });
    const sameItem: any = {};
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
      const item = sameItem[key];
      const values: any[] = [];
      inc.params?.forEach((param) => {
        const paramR = param.split(".");
        const lastest = paramR[paramR.length - 1];
        const find = item.find((inItem: any) => inItem.key.includes(lastest));
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
export function mapDataFromList({
  inc,
  keyNames,
  identities,
  flatData,
  data,
}: {
  inc: Include;
  keyNames: string[];
  identities: Identity[];
  flatData: any;
  data: any[];
}) {
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
      const filter = data.filter((inList: any) => {
        const find = id.value.find((inValue: any) => {
          if (keyMap) return inValue.toString() === inList[keyMap].toString();
          return Object.keys(inList).find(
            (keyInList) => inList[keyInList].toString() === inValue.toString()
          );
        });
        return find;
      });
      flatData[keyName] = filter;
      i++;
      continue;
    } else {
      let includeData = null;
      includeData = data.find((inList: any) => {
        if (keyMap) return inList[keyMap].toString() === id.value.toString();
        return Object.keys(inList).find(
          (keyInList) => inList[keyInList].toString() === id.value.toString()
        );
      });
      flatData[keyName] = includeData || null;
      i++;
      continue;
    }
  }
  return flatData;
}
