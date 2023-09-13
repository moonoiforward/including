import Random from "./random";
export default class MyString {
  static generateId() {
    return Date.now() + "_" + Random.stringWithNumber(5);
  }
}
