import { CURRENCY, SITE } from "./constants";

export function money(amount: number, currency = "USD") {
  const sym = CURRENCY[currency] ?? currency;
  return sym === "¥" ? `¥ ${amount.toLocaleString()}` : `${sym} ${amount.toLocaleString()}`;
}

export function usd(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export function approxCny(usdAmount: number) {
  return `约 ¥${Math.round(usdAmount * SITE.usdToCny).toLocaleString()}`;
}

export function date(d: Date | string | null | undefined) {
  if (!d) return "—";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function dateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const x = new Date(d);
  return `${date(x)} ${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
}

/** “今天 / 3 天前” 这类相对时间 */
export function ago(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const day = Math.floor(diff / 86400000);
  if (day <= 0) {
    const h = Math.floor(diff / 3600000);
    if (h <= 0) return "刚刚";
    return `${h} 小时前`;
  }
  if (day === 1) return "1 天前";
  if (day < 30) return `${day} 天前`;
  return date(d);
}

export function orderNo() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `GM${stamp}${Math.random().toString().slice(2, 8)}`;
}

export function today() {
  return date(new Date());
}
