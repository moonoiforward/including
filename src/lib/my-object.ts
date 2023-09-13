import * as flat from "flat";
import { isNumber } from "./regex";
export default class MyObject {
  static filterDuplicate(arr: any[]) {
    return arr.filter(function (item, pos) {
      return arr.indexOf(item) == pos;
    });
  }
  static unflatten(data: any) {
    return flat.unflatten(data);
  }
  static flatten(data: any) {
    let flatData: any = flat.flatten(data);

    /**
     * if deepest is array make to array
     */
    Object.keys(flatData).forEach((key) => {
      const keySplit = key.split(".");
      if (keySplit.length > 1) {
        const last = keySplit[keySplit.length - 1];
        if (isNumber(last)) {
          keySplit.pop();
          const keyForArray = keySplit.join(".");
          if (flatData[keyForArray]) {
            flatData[keyForArray].push(flatData[key]);
          } else {
            flatData[keyForArray] = [flatData[key]];
          }
          delete flatData[key];
        }
      }
    });
    return flatData;
  }
}
