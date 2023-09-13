export function isNumber(str: string): boolean {
  return /^\d+$/.test(str);
}
export function isNotNumber(str: string): boolean {
  return !/^\d+$/.test(str);
}
