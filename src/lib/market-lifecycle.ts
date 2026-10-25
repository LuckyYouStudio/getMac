import "server-only";
import { db } from "./db";
import { addDays } from "./dates";
import { MARKET_LIMITS } from "./constants";

/**
 * 把超过确认有效期的方案和求租标记为过期。
 * 没有定时任务，在市场列表、详情和后台读取前惰性调用。
 */
export async function expireStaleMarket() {
  const now = new Date();
  await db.$transaction([
    db.listing.updateMany({
      where: { status: { in: ["PUBLISHED", "PAUSED"] }, expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    }),
    db.wantedPost.updateMany({
      where: { status: "OPEN", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    }),
  ]);
}

/** 房东确认仍可租 / 编辑 / 回复租客时续期 */
export function listingRenewal(now = new Date()) {
  return { confirmedAt: now, expiresAt: addDays(now, MARKET_LIMITS.listingTtlDays) };
}

export function wantedRenewal(now = new Date()) {
  return { confirmedAt: now, expiresAt: addDays(now, MARKET_LIMITS.wantedTtlDays) };
}
