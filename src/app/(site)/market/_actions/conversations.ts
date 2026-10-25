"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, startOfToday } from "@/lib/dates";
import { MARKET_LIMITS } from "@/lib/constants";
import { listingRenewal } from "@/lib/market-lifecycle";
import { date } from "@/lib/format";
import {
  assertCanStart, dailyInquiryCap, done, fail, inquiriesStartedToday, isBlockedBetween, returnTo, str,
} from "../_server/guards";
import { publishDueReviews } from "../_server/reviews";

const START_LABEL: Record<string, string> = { ASAP: "尽快", TBD: "待定" };

/** 租客就某个方案发起咨询 */
export async function startInquiryAction(fd: FormData) {
  const listingId = str(fd, "listingId");
  const back = `/market/${listingId}`;
  const user = await requireUser(back);
  const l = await db.listing.findUnique({ where: { id: listingId } });
  if (!l || l.status !== "PUBLISHED") fail(back, "该方案当前不接受新的咨询。");
  if (l.hostId === user.id) fail(back, "不能咨询自己发布的方案。");

  const existing = await db.inquiry.findFirst({ where: { listingId, renterId: user.id } });
  if (existing) redirect(`/market/messages/${existing.id}`);

  assertCanStart(user, back);
  if (l.availability === "FULL") fail(back, "房东标注暂无空位，暂时不能咨询。");
  if (await isBlockedBetween(user.id, l.hostId)) fail(back, "你们之间存在屏蔽关系，无法发起对话。");

  const purpose = str(fd, "purpose");
  const term = str(fd, "term");
  const startMode = str(fd, "startMode");
  const startDate = str(fd, "startDate");
  const question = str(fd, "question");
  if (purpose.length < 2) fail(back, "请写一下用途。");
  if (!term) fail(back, "请填写预计租多久。");
  if (!["ASAP", "TBD", "DATE"].includes(startMode)) fail(back, "请选择开始时间。");
  if (startMode === "DATE" && (!startDate || new Date(startDate) < startOfToday())) fail(back, "请选择一个今天以后的开始日期。");
  if (fd.get("consent") !== "on") fail(back, "请先勾选确认平台角色与 macOS 许可说明。");
  if (question.length > 1000) fail(back, "问题最多 1000 字。");

  if ((await inquiriesStartedToday(user.id)) >= dailyInquiryCap(user)) {
    fail(back, `今天发起的新对话已达上限（${dailyInquiryCap(user)} 个），明天再来吧。`);
  }

  const startText = startMode === "DATE" ? date(startDate) : START_LABEL[startMode];
  const body = [
    `你好，我想咨询「${l.title}」。`,
    `用途：${purpose}`,
    `希望开始：${startText}`,
    `预计租期：${term}`,
    question ? `\n${question}` : "",
  ].filter(Boolean).join("\n");

  const inq = await db.inquiry.create({
    data: {
      listingId, renterId: user.id, hostId: l.hostId,
      purpose, startMode, startDate: startMode === "DATE" ? new Date(startDate) : null, term,
      listingSnapshot: JSON.stringify({
        title: l.title, price: l.price, currency: l.currency, minMonths: l.minMonths,
        firstPayment: l.firstPayment, deposit: l.deposit, extraFees: l.extraFees, at: new Date().toISOString(),
      }),
      messages: { create: { senderId: user.id, body } },
    },
  });
  revalidatePath("/market/messages");
  redirect(`/market/messages/${inq.id}`);
}

/** 房东回应求租 */
export async function respondWantedAction(fd: FormData) {
  const wantedId = str(fd, "wantedId");
  const back = `/market/wanted/${wantedId}`;
  const user = await requireUser(back);
  const w = await db.wantedPost.findUnique({ where: { id: wantedId }, include: { _count: { select: { responses: true } } } });
  if (!w || w.status !== "OPEN") fail(back, "这条求租已不在征集中。");
  if (w.userId === user.id) fail(back, "不能回应自己的求租。");

  const existing = await db.inquiry.findFirst({ where: { wantedId, hostId: user.id } });
  if (existing) redirect(`/market/messages/${existing.id}`);

  assertCanStart(user, back);
  const published = await db.listing.findMany({ where: { hostId: user.id, status: "PUBLISHED" }, select: { id: true } });
  if (published.length === 0) fail(back, "你需要至少有一个发布中的方案，才能回应求租。");
  if (w._count.responses >= MARKET_LIMITS.wantedMaxResponses) fail(back, "这条求租的回应已满。");
  if (await isBlockedBetween(user.id, w.userId)) fail(back, "你们之间存在屏蔽关系，无法发起对话。");
  const today = await db.inquiry.count({ where: { hostId: user.id, wantedId: { not: null }, createdAt: { gte: startOfToday() } } });
  if (today >= MARKET_LIMITS.wantedHostDailyResponses) fail(back, `每天最多回应 ${MARKET_LIMITS.wantedHostDailyResponses} 条求租。`);
  if ((await inquiriesStartedToday(user.id)) >= dailyInquiryCap(user)) fail(back, "今天发起的新对话已达上限。");

  const body = str(fd, "body");
  if (body.length < 5) fail(back, "回应至少写 5 个字，说明你能提供什么。");
  if (body.length > 1000) fail(back, "回应最多 1000 字。");
  const listingId = str(fd, "listingId");
  const linked = published.find((p) => p.id === listingId);

  const inq = await db.inquiry.create({
    data: {
      wantedId, listingId: linked?.id ?? null, renterId: w.userId, hostId: user.id, hostRepliedAt: new Date(),
      messages: { create: { senderId: user.id, body } },
    },
  });
  revalidatePath(back);
  redirect(`/market/messages/${inq.id}`);
}

async function loadThread(fd: FormData) {
  const id = str(fd, "inquiryId");
  const back = `/market/messages/${id}`;
  const user = await requireUser(back);
  const inq = await db.inquiry.findUnique({ where: { id }, include: { listing: true } });
  if (!inq || (inq.renterId !== user.id && inq.hostId !== user.id)) fail("/market/messages", "对话不存在");
  const otherId = inq.renterId === user.id ? inq.hostId : inq.renterId;
  return { user, inq, back, otherId, isHost: inq.hostId === user.id };
}

export async function replyAction(fd: FormData) {
  const { user, inq, back, otherId, isHost } = await loadThread(fd);
  if (await isBlockedBetween(user.id, otherId)) fail(back, "你们之间存在屏蔽关系，不能继续发消息。");
  const body = str(fd, "body");
  if (!body) fail(back, "消息不能为空");
  if (body.length > 2000) fail(back, "单条消息最多 2000 字");
  const now = new Date();
  await db.$transaction([
    db.message.create({ data: { inquiryId: inq.id, senderId: user.id, body } }),
    db.inquiry.update({ where: { id: inq.id }, data: { updatedAt: now, ...(isHost && !inq.hostRepliedAt ? { hostRepliedAt: now } : {}) } }),
    // 房东回复租客等同于确认方案仍可租
    ...(isHost && inq.listing && ["PUBLISHED", "PAUSED"].includes(inq.listing.status)
      ? [db.listing.update({ where: { id: inq.listing.id }, data: listingRenewal(now) })]
      : []),
  ]);
  revalidatePath(back);
  redirect(back);
}

/** 成交确认：发起 / 确认 / 拒绝 / 撤回 */
export async function dealAction(fd: FormData) {
  const { user, inq, back } = await loadThread(fd);
  const op = str(fd, "op");
  const open = await db.deal.findFirst({ where: { inquiryId: inq.id, status: { in: ["PROPOSED", "CONFIRMED"] } } });

  if (op === "propose") {
    if (open) fail(back, open.status === "CONFIRMED" ? "这段对话已经确认成交。" : "已有一个待确认的成交。");
    await db.deal.create({ data: { inquiryId: inq.id, proposerId: user.id } });
    await db.message.create({ data: { inquiryId: inq.id, senderId: user.id, body: "【系统】我发起了“确认成交”，请对方确认。" } });
  } else {
    if (!open || open.status !== "PROPOSED") fail(back, "没有待确认的成交。");
    if (op === "cancel") {
      if (open.proposerId !== user.id) fail(back, "只有发起人可以撤回。");
      await db.deal.update({ where: { id: open.id }, data: { status: "CANCELLED" } });
    } else if (op === "confirm" || op === "decline") {
      if (open.proposerId === user.id) fail(back, "需要由对方确认。");
      const confirmed = op === "confirm";
      await db.deal.update({ where: { id: open.id }, data: confirmed ? { status: "CONFIRMED", confirmedAt: new Date() } : { status: "DECLINED" } });
      await db.message.create({
        data: { inquiryId: inq.id, senderId: user.id, body: confirmed ? "【系统】双方已确认成交。" : "【系统】我暂时不确认这次成交。" },
      });
    } else fail(back, "未知操作");
  }
  revalidatePath(back);
  done(back, "已更新");
}

/** 成交后的交付记录：房东标记已交付，租客标记能否连上 */
export async function deliveryAction(fd: FormData) {
  const { inq, back, isHost } = await loadThread(fd);
  const deal = await db.deal.findFirst({ where: { inquiryId: inq.id, status: "CONFIRMED" } });
  if (!deal) fail(back, "还没有确认成交");
  if (isHost) {
    await db.deal.update({ where: { id: deal.id }, data: { hostDelivered: true } });
  } else {
    const v = str(fd, "connected");
    if (v !== "YES" && v !== "NO") fail(back, "请选择是否能连上");
    await db.deal.update({ where: { id: deal.id }, data: { renterConnected: v } });
  }
  revalidatePath(back);
  done(back, "交付记录已更新");
}

export async function reviewAction(fd: FormData) {
  const { user, inq, back, otherId } = await loadThread(fd);
  const deal = await db.deal.findFirst({ where: { inquiryId: inq.id, status: "CONFIRMED" } });
  if (!deal?.confirmedAt) fail(back, "确认成交后才能评价");
  if (deal.confirmedAt < addDays(new Date(), -MARKET_LIMITS.reviewWindowDays)) fail(back, `评价需在成交后 ${MARKET_LIMITS.reviewWindowDays} 天内提交`);
  const rating = Number(str(fd, "rating"));
  const body = str(fd, "body");
  if (!(rating >= 1 && rating <= 5)) fail(back, "请选择 1–5 星");
  if (body.length < 4 || body.length > 500) fail(back, "评价内容 4–500 字");
  const dup = await db.review.findUnique({ where: { dealId_authorId: { dealId: deal.id, authorId: user.id } } });
  if (dup) fail(back, "你已经评价过了");
  await db.review.create({ data: { dealId: deal.id, authorId: user.id, targetId: otherId, rating, body } });
  await publishDueReviews();
  revalidatePath(back);
  done(back, "评价已提交，双方都提交后同时公开。");
}

export async function blockAction(fd: FormData) {
  const user = await requireUser("/market/messages");
  const back = returnTo(fd, "/market/messages");
  const target = str(fd, "userId");
  if (!target || target === user.id) fail(back, "无效操作");
  if (str(fd, "op") === "unblock") {
    await db.block.deleteMany({ where: { blockerId: user.id, blockedId: target } });
    done(back, "已取消屏蔽");
  }
  await db.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: target } },
    create: { blockerId: user.id, blockedId: target },
    update: {},
  });
  done(back, "已屏蔽，对方不能再给你发消息或发起咨询。");
}
