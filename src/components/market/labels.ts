// 市场里通用的展示小工具
import type { Listing } from "@prisma/client";
import { AVAILABILITY, COUNTRIES } from "@/lib/constants";
import { date, money } from "@/lib/format";

export function countryName(code: string | null | undefined) {
  if (!code) return "";
  return COUNTRIES[code] ?? code;
}

export function location(l: { country?: string | null; region?: string | null; city?: string | null }) {
  return [countryName(l.country), l.region, l.city].filter(Boolean).join(" ");
}

export function deviceLabel(l: Pick<Listing, "machineType" | "chip">) {
  return `${l.machineType} ${l.chip}`;
}

export function fee(n: number, currency: string) {
  return n > 0 ? money(n, currency) : "无";
}

/** “USD 108 / 月 · 最短 1 月 · 首期 USD 0 · 押金 无 · 额外费用 无” */
export function priceLine(l: Pick<Listing, "price" | "currency" | "minMonths" | "firstPayment" | "deposit" | "extraFees">) {
  return [
    `最短 ${l.minMonths} 月`,
    `首期 ${money(l.firstPayment, l.currency)}`,
    `押金 ${fee(l.deposit, l.currency)}`,
    `额外费用 ${l.extraFees || "无"}`,
  ].join(" · ");
}

export function availabilityLabel(l: Pick<Listing, "availability" | "availableFrom">) {
  if (l.availability === "FROM_DATE" && l.availableFrom) return `预计 ${date(l.availableFrom).slice(5)} 起可咨询`;
  return AVAILABILITY[l.availability] ?? l.availability;
}

export function availabilityTone(l: Pick<Listing, "availability">): "ok" | "warn" | "muted" {
  return l.availability === "AVAILABLE" ? "ok" : l.availability === "FROM_DATE" ? "warn" : "muted";
}

/** 把 ?ok= / ?err= 拼回路径 */
export function withMsg(path: string, kind: "ok" | "err", text: string) {
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${kind}=${encodeURIComponent(text)}${hash ? `#${hash}` : ""}`;
}
