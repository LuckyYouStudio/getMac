"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays } from "@/lib/dates";
import { findContactInfo } from "@/lib/contact-guard";
import {
  ADMIN_ACCESS, AVAILABILITY, CHIPS, COUNTRIES, MACHINE_TYPES, MARKET_LIMITS, MIN_MONTH_OPTIONS,
  NETWORK, REMOTE_METHODS, RESTART,
} from "@/lib/constants";
import { listingRenewal } from "@/lib/market-lifecycle";
import { withMsg } from "@/components/market/labels";
import { assertCanStart, done, fail, num, optStr, returnTo, str } from "../_server/guards";

export type ListingFormState = { error?: string; step?: number } | undefined;

const ACTIVE = ["PUBLISHED", "PAUSED", "NEEDS_CHANGES"];

const keyOf = (o: Record<string, unknown>) => Object.keys(o) as [string, ...string[]];

const publishSchema = z.object({
  title: z.string().min(4, "标题至少 4 个字").max(60, "标题最多 60 字"),
  machineType: z.enum(MACHINE_TYPES as [string, ...string[]], { error: "请选择机型" }),
  chip: z.enum(["其他", ...CHIPS] as [string, ...string[]], { error: "请选择芯片" }),
  memory: z.number({ error: "请填写内存" }).int().min(4, "请填写内存").max(512),
  storage: z.number({ error: "请填写硬盘容量" }).int().min(64, "请填写硬盘容量").max(16384),
  osVersion: z.string().max(30).nullable(),
  country: z.enum(keyOf(COUNTRIES), { error: "请选择国家/地区" }),
  region: z.string().max(30).nullable(),
  city: z.string().max(30).nullable(),
  network: z.enum(keyOf(NETWORK), { error: "请选择网络类型" }),
  bandwidth: z.string().max(40).nullable(),
  adminAccess: z.enum(keyOf(ADMIN_ACCESS), { error: "请选择权限" }),
  remoteMethods: z.array(z.enum(REMOTE_METHODS as [string, ...string[]])).min(1, "至少选择一种远程方式"),
  restart: z.enum(keyOf(RESTART)),
  currency: z.enum(["USD", "CNY"], { error: "请选择币种" }),
  price: z.number({ error: "请填写月租" }).int().min(1, "请填写月租"),
  minMonths: z.number().refine((n) => MIN_MONTH_OPTIONS.includes(n), "最短租期只能是 1、3、6 或 12 个月"),
  firstPayment: z.number({ error: "首期需为非负整数" }).int().min(0),
  deposit: z.number({ error: "押金需为非负整数" }).int().min(0),
  extraFees: z.string().max(100).nullable(),
  paymentMethods: z.string().max(100).nullable(),
  supportHours: z.string().max(60).nullable(),
  deliveryNotes: z.string().max(300).nullable(),
  refundPolicy: z.string().max(300).nullable(),
  dataCleanup: z.string().max(200).nullable(),
  hostWebsite: z.string().max(200).nullable().refine((v) => !v || /^https?:\/\//.test(v), "网站需以 http:// 或 https:// 开头"),
  description: z.string().min(20, "描述至少 20 字，写清交付方式和使用限制").max(3000, "描述最多 3000 字"),
  availability: z.enum(keyOf(AVAILABILITY)),
});

// 每个字段所在的向导步骤，用于把错误定位回对应步骤
const FIELD_STEP: Record<string, number> = {
  title: 1, machineType: 1, chip: 1, memory: 1, storage: 1, osVersion: 1,
  country: 2, region: 2, city: 2, network: 2, bandwidth: 2,
  adminAccess: 3, remoteMethods: 3, restart: 3, availability: 3,
  currency: 4, price: 4, minMonths: 4, firstPayment: 4, deposit: 4, extraFees: 4, paymentMethods: 4,
  supportHours: 5, deliveryNotes: 5, refundPolicy: 5, dataCleanup: 5, hostWebsite: 5, description: 5,
};

function readForm(fd: FormData) {
  return {
    title: str(fd, "title"),
    machineType: str(fd, "machineType"),
    chip: str(fd, "chip"),
    memory: num(fd, "memory") ?? 0,
    storage: num(fd, "storage") ?? 0,
    osVersion: optStr(fd, "osVersion"),
    country: str(fd, "country"),
    region: optStr(fd, "region"),
    city: optStr(fd, "city"),
    network: str(fd, "network"),
    bandwidth: optStr(fd, "bandwidth"),
    adminAccess: str(fd, "adminAccess"),
    remoteMethods: fd.getAll("remoteMethods").map(String),
    restart: str(fd, "restart") || "UNSTATED",
    currency: str(fd, "currency"),
    price: num(fd, "price") ?? 0,
    minMonths: num(fd, "minMonths") ?? 1,
    firstPayment: num(fd, "firstPayment") ?? 0,
    deposit: num(fd, "deposit") ?? 0,
    extraFees: optStr(fd, "extraFees"),
    paymentMethods: optStr(fd, "paymentMethods"),
    supportHours: optStr(fd, "supportHours"),
    deliveryNotes: optStr(fd, "deliveryNotes"),
    refundPolicy: optStr(fd, "refundPolicy"),
    dataCleanup: optStr(fd, "dataCleanup"),
    hostWebsite: optStr(fd, "hostWebsite"),
    description: str(fd, "description"),
    availability: str(fd, "availability") || "AVAILABLE",
  };
}

function toData(v: ReturnType<typeof readForm>, fd: FormData) {
  const from = str(fd, "availableFrom");
  return {
    ...v,
    remoteMethods: JSON.stringify(v.remoteMethods),
    ssh: v.remoteMethods.includes("SSH"),
    selfInstall: fd.get("selfInstall") === "on",
    availableFrom: v.availability === "FROM_DATE" && from ? new Date(from) : null,
  };
}

/** 保存草稿或发布。发布后立即展示，平台事后复查。 */
export async function saveListingAction(_: ListingFormState, fd: FormData): Promise<ListingFormState> {
  const user = await requireUser("/market/publish");
  if (user.restricted) return { error: "你的账号目前受限，不能发布方案。" };
  const intent = str(fd, "intent"); // draft | publish
  const id = str(fd, "id");
  const existing = id ? await db.listing.findUnique({ where: { id } }) : null;
  if (id && (!existing || existing.hostId !== user.id)) return { error: "方案不存在" };
  if (existing?.status === "REMOVED") return { error: "该方案已被平台下架，不能再编辑。" };

  const v = readForm(fd);

  const contact = findContactInfo(v.title, v.description, v.extraFees, v.paymentMethods, v.supportHours, v.deliveryNotes, v.refundPolicy, v.dataCleanup, v.bandwidth);
  if (contact) return { error: `公开内容里不能留${contact}，请删掉后再保存。联系一律通过站内对话。` };

  if (intent === "draft") {
    if (v.title.length < 2) return { error: "草稿至少要有标题", step: 1 };
    // 草稿不做完整校验，只存能存的字段
    const draft = toData(v, fd);
    const data = {
      ...draft,
      machineType: draft.machineType || "Mac mini",
      chip: draft.chip || "其他",
      country: draft.country || "OTHER",
      network: draft.network || "HOME",
      adminAccess: draft.adminAccess || "NEGOTIABLE",
      currency: draft.currency || "USD",
      minMonths: MIN_MONTH_OPTIONS.includes(draft.minMonths) ? draft.minMonths : 1,
    };
    if (existing && existing.status !== "DRAFT") return { error: "已发布的方案不能存为草稿，请直接保存修改。" };
    const saved = existing
      ? await db.listing.update({ where: { id: existing.id }, data })
      : await db.listing.create({ data: { ...data, hostId: user.id, status: "DRAFT" } });
    revalidatePath("/market/mine");
    redirect(withMsg(`/market/${saved.id}/edit`, "ok", "草稿已保存，可以稍后继续填写。"));
  }

  const parsed = publishSchema.safeParse(v);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, step: FIELD_STEP[String(issue.path[0])] ?? 1 };
  }
  if (v.availability === "FROM_DATE") {
    const from = str(fd, "availableFrom");
    if (!from || new Date(from) <= new Date()) return { error: "请选择一个将来的可咨询日期", step: 3 };
  }
  if (fd.get("agreeRules") !== "on") return { error: "请确认已阅读并遵守市场规则", step: 6 };
  if (fd.get("agreeLicense") !== "on") return { error: "请确认整机出租符合 macOS 许可", step: 6 };

  // 新发布（或从草稿/过期/关闭恢复）时检查数量上限
  const becomingActive = !existing || !ACTIVE.includes(existing.status);
  if (becomingActive) {
    const active = await db.listing.count({ where: { hostId: user.id, status: { in: ACTIVE } } });
    if (active >= MARKET_LIMITS.maxActiveListings) {
      return { error: `每个账号最多同时有 ${MARKET_LIMITS.maxActiveListings} 个有效方案，请先关闭不用的方案。`, step: 6 };
    }
    // 同一账号不能重复发布完全相同的方案
    const dup = await db.listing.count({
      where: { hostId: user.id, status: { in: ACTIVE }, title: v.title, id: existing ? { not: existing.id } : undefined },
    });
    if (dup > 0) return { error: "你已经有一个同名的有效方案，请修改原方案而不是重复发布。", step: 1 };
  }

  const now = new Date();
  const data = { ...toData(parsed.data as ReturnType<typeof readForm>, fd), ...listingRenewal(now) };
  let saved;
  if (!existing) {
    saved = await db.listing.create({ data: { ...data, hostId: user.id, status: "PUBLISHED", publishedAt: now } });
  } else {
    // 发布中/暂停的保持原状态；需修改的重新提交后恢复展示；草稿/过期/关闭的重新发布
    const status = existing.status === "PAUSED" ? "PAUSED" : "PUBLISHED";
    saved = await db.listing.update({
      where: { id: existing.id },
      data: {
        ...data,
        status,
        closedAt: null,
        reviewNote: existing.status === "NEEDS_CHANGES" ? `[房东已修改] ${existing.reviewNote ?? ""}`.trim() : existing.reviewNote,
        publishedAt: existing.publishedAt ?? now,
      },
    });
  }
  revalidatePath("/market");
  revalidatePath("/market/mine");
  redirect(withMsg(`/market/${saved.id}`, "ok", existing?.status === "PUBLISHED" ? "修改已保存，方案继续展示。" : "方案已发布，平台会在之后复查。"));
}

/** 我的方案里的各项操作 */
export async function listingOpAction(fd: FormData) {
  const user = await requireUser("/market/mine");
  const back = returnTo(fd, "/market/mine");
  const l = await db.listing.findUnique({ where: { id: str(fd, "id") } });
  if (!l || l.hostId !== user.id) fail(back, "方案不存在");
  const op = str(fd, "op");
  const now = new Date();

  switch (op) {
    case "confirm": {
      if (l.status === "EXPIRED") {
        assertCanStart(user, back);
        const active = await db.listing.count({ where: { hostId: user.id, status: { in: ACTIVE } } });
        if (active >= MARKET_LIMITS.maxActiveListings) fail(back, `最多同时有 ${MARKET_LIMITS.maxActiveListings} 个有效方案。`);
        await db.listing.update({ where: { id: l.id }, data: { status: "PUBLISHED", ...listingRenewal(now) } });
        break;
      }
      if (!["PUBLISHED", "PAUSED"].includes(l.status)) fail(back, "当前状态不需要确认");
      if (l.expiresAt > addDays(now, MARKET_LIMITS.listingConfirmWindowDays)) {
        fail(back, `到期前 ${MARKET_LIMITS.listingConfirmWindowDays} 天内才能确认，现在还不用确认。`);
      }
      await db.listing.update({ where: { id: l.id }, data: listingRenewal(now) });
      break;
    }
    case "pause":
      if (l.status !== "PUBLISHED") fail(back, "只有发布中的方案可以暂停");
      await db.listing.update({ where: { id: l.id }, data: { status: "PAUSED" } });
      break;
    case "resume":
      if (l.status !== "PAUSED") fail(back, "方案没有暂停");
      await db.listing.update({ where: { id: l.id }, data: { status: "PUBLISHED", ...listingRenewal(now) } });
      break;
    case "availability": {
      const a = str(fd, "availability");
      if (!(a in AVAILABILITY)) fail(back, "档期无效");
      const from = str(fd, "availableFrom");
      if (a === "FROM_DATE" && (!from || new Date(from) <= now)) fail(back, "请选择一个将来的日期");
      await db.listing.update({
        where: { id: l.id },
        data: { availability: a, availableFrom: a === "FROM_DATE" ? new Date(from) : null, ...(ACTIVE.includes(l.status) ? listingRenewal(now) : {}) },
      });
      break;
    }
    case "close":
      if (!["PUBLISHED", "PAUSED", "NEEDS_CHANGES", "EXPIRED"].includes(l.status)) fail(back, "当前状态不能关闭");
      await db.listing.update({ where: { id: l.id }, data: { status: "CLOSED", closedAt: now } });
      break;
    case "reopen": {
      if (l.status !== "CLOSED") fail(back, "方案没有关闭");
      if (!l.closedAt || l.closedAt < addDays(now, -MARKET_LIMITS.listingReopenDays)) {
        fail(back, `关闭超过 ${MARKET_LIMITS.listingReopenDays} 天的方案不能重新开放，请重新发布。`);
      }
      assertCanStart(user, back);
      const active = await db.listing.count({ where: { hostId: user.id, status: { in: ACTIVE } } });
      if (active >= MARKET_LIMITS.maxActiveListings) fail(back, `最多同时有 ${MARKET_LIMITS.maxActiveListings} 个有效方案。`);
      await db.listing.update({ where: { id: l.id }, data: { status: "PUBLISHED", closedAt: null, ...listingRenewal(now) } });
      break;
    }
    case "deleteDraft":
      if (l.status !== "DRAFT") fail(back, "只有草稿可以删除");
      await db.listing.delete({ where: { id: l.id } });
      break;
    default:
      fail(back, "未知操作");
  }
  revalidatePath("/market");
  revalidatePath("/market/mine");
  done(back, "已更新");
}
