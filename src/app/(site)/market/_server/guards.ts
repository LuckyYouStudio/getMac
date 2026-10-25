import "server-only";
import type { User } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { addDays, startOfToday } from "@/lib/dates";
import { MARKET_LIMITS } from "@/lib/constants";
import { withMsg } from "@/components/market/labels";

export function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export function optStr(fd: FormData, key: string) {
  return str(fd, key) || null;
}

export function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** 表单里的 returnTo，只接受站内路径 */
export function returnTo(fd: FormData, fallback: string) {
  const r = str(fd, "returnTo");
  return r.startsWith("/") && !r.startsWith("//") ? r : fallback;
}

export function fail(path: string, text: string): never {
  redirect(withMsg(path, "err", text));
}

export function done(path: string, text: string): never {
  redirect(withMsg(path, "ok", text));
}

export function isNewAccount(user: Pick<User, "createdAt">) {
  return user.createdAt > addDays(new Date(), -MARKET_LIMITS.newAccountDays);
}

/** 受限账号只能回复已有对话，不能发起咨询或发布 */
export function assertCanStart(user: User, path: string) {
  if (user.restricted) fail(path, "你的账号目前受限，只能回复已有对话，不能发起新咨询或发布内容。");
}

/** 双方任一方拉黑了对方 */
export async function isBlockedBetween(a: string, b: string) {
  const n = await db.block.count({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return n > 0;
}

/** 今天发起的新对话数（咨询 + 回应求租） */
export async function inquiriesStartedToday(userId: string) {
  return db.inquiry.count({
    where: { createdAt: { gte: startOfToday() }, OR: [{ renterId: userId, listingId: { not: null } }, { hostId: userId, wantedId: { not: null } }] },
  });
}

export function dailyInquiryCap(user: User) {
  return isNewAccount(user) ? MARKET_LIMITS.newAccountDailyInquiries : MARKET_LIMITS.dailyInquiries;
}
