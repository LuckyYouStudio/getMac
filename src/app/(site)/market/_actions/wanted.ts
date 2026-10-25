"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, startOfToday } from "@/lib/dates";
import { findContactInfo } from "@/lib/contact-guard";
import { CHIPS, COUNTRIES, MARKET_LIMITS, REMOTE_METHODS } from "@/lib/constants";
import { wantedRenewal } from "@/lib/market-lifecycle";
import { withMsg } from "@/components/market/labels";
import { assertCanStart, done, fail, num, optStr, returnTo, str } from "../_server/guards";

export async function createWantedAction(fd: FormData) {
  const back = "/market/wanted/new";
  const user = await requireUser(back);
  assertCanStart(user, back);

  const active = await db.wantedPost.count({ where: { userId: user.id, status: "OPEN" } });
  if (active >= MARKET_LIMITS.maxActiveWanted) {
    fail(back, `每个账号最多同时有 ${MARKET_LIMITS.maxActiveWanted} 条征集中的求租，请先关闭旧的。`);
  }

  const title = str(fd, "title");
  const purpose = str(fd, "purpose");
  const description = str(fd, "description");
  const chipMin = optStr(fd, "chipMin");
  const country = optStr(fd, "country");
  const memMin = num(fd, "memMin");
  const budgetMin = num(fd, "budgetMin");
  const budgetMax = num(fd, "budgetMax");
  const termMonths = num(fd, "termMonths") ?? 0;
  const startRaw = str(fd, "startDate");
  const remote = fd.getAll("remoteMethods").map(String).filter((m) => REMOTE_METHODS.includes(m));

  if (title.length < 4 || title.length > 60) fail(back, "标题 4–60 字");
  if (purpose.length < 2 || purpose.length > 60) fail(back, "请简单写一下用途（60 字以内）");
  if (description.length < 10 || description.length > 1500) fail(back, "详细需求 10–1500 字");
  if (chipMin && !CHIPS.includes(chipMin)) fail(back, "芯片选项无效");
  if (country && !(country in COUNTRIES)) fail(back, "国家/地区无效");
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) fail(back, "最低预算不能高于最高预算");
  if (termMonths < 1 || termMonths > 36) fail(back, "预计租期 1–36 个月");
  let startDate: Date | null = null;
  if (startRaw) {
    startDate = new Date(startRaw);
    if (startDate < startOfToday() || startDate > addDays(new Date(), 180)) fail(back, "开始日期需在今天到 180 天之内");
  }
  const contact = findContactInfo(title, purpose, description, str(fd, "region"));
  if (contact) fail(back, `公开内容里不能留${contact}。房东会通过站内对话联系你。`);

  const w = await db.wantedPost.create({
    data: {
      userId: user.id, title, purpose, description, chipMin, memMin, country, region: optStr(fd, "region"),
      adminNeeded: fd.get("adminNeeded") === "on", remoteMethods: JSON.stringify(remote),
      budgetMin, budgetMax, startDate, termMonths, ...wantedRenewal(),
    },
  });
  revalidatePath("/market/wanted");
  redirect(withMsg(`/market/wanted/${w.id}`, "ok", "求租已发布，有空位的房东会在站内回应你。"));
}

export async function wantedOpAction(fd: FormData) {
  const id = str(fd, "id");
  const back = returnTo(fd, `/market/wanted/${id}`);
  const user = await requireUser(back);
  const w = await db.wantedPost.findUnique({ where: { id } });
  if (!w || w.userId !== user.id) fail(back, "求租不存在");
  const now = new Date();
  const op = str(fd, "op");

  if (op === "fill" || op === "close") {
    if (w.status !== "OPEN" && w.status !== "EXPIRED") fail(back, "当前状态不能关闭");
    await db.wantedPost.update({ where: { id }, data: { status: op === "fill" ? "FILLED" : "CLOSED", closedAt: now } });
  } else if (op === "confirm") {
    if (w.status === "OPEN" && w.expiresAt > addDays(now, MARKET_LIMITS.listingConfirmWindowDays)) {
      fail(back, `到期前 ${MARKET_LIMITS.listingConfirmWindowDays} 天内才需要确认。`);
    }
    if (w.status !== "OPEN" && w.status !== "EXPIRED") fail(back, "当前状态不能确认");
    if (w.status === "EXPIRED") await assertActiveCap(user.id, back);
    await db.wantedPost.update({ where: { id }, data: { status: "OPEN", ...wantedRenewal(now) } });
  } else if (op === "reopen") {
    if (w.status !== "CLOSED" && w.status !== "FILLED") fail(back, "当前状态不能重新开放");
    if (!w.closedAt || w.closedAt < addDays(now, -MARKET_LIMITS.wantedReopenDays)) {
      fail(back, `关闭超过 ${MARKET_LIMITS.wantedReopenDays} 天的求租不能重新开放，请重新发布。`);
    }
    await assertActiveCap(user.id, back);
    await db.wantedPost.update({ where: { id }, data: { status: "OPEN", closedAt: null, ...wantedRenewal(now) } });
  } else fail(back, "未知操作");

  revalidatePath("/market/wanted");
  done(back, "已更新");
}

async function assertActiveCap(userId: string, back: string) {
  const active = await db.wantedPost.count({ where: { userId, status: "OPEN" } });
  if (active >= MARKET_LIMITS.maxActiveWanted) fail(back, `最多同时有 ${MARKET_LIMITS.maxActiveWanted} 条征集中的求租。`);
}
