export function isEquitySymbol(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{1,5}(?:\.[A-Z])?$/.test(value);
}
