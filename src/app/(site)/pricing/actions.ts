"use server";

import { db } from "@/lib/db";

export type RestockState = { error?: string; ok?: boolean } | undefined;

/** 缺货时登记到货通知：电话 / 邮箱 / 微信至少一项 */
export async function createRestockAlertAction(_: RestockState, fd: FormData): Promise<RestockState> {
  if (String(fd.get("website") ?? "")) return { ok: true }; // 蜜罐字段，机器人直接丢弃
  const slug = String(fd.get("plan") ?? "");
  const phoneCountry = String(fd.get("phoneCountry") ?? "").trim() || null;
  const phone = String(fd.get("phone") ?? "").replace(/[^\d]/g, "") || null;
  const email = String(fd.get("email") ?? "").trim().toLowerCase() || null;
  const wechat = String(fd.get("wechat") ?? "").trim() || null;
  const usage = String(fd.get("usage") ?? "").trim().slice(0, 500) || null;

  if (!phone && !email && !wechat) return { error: "电话、邮箱、微信至少留一项，到货时我们才能通知你" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "邮箱格式不正确" };
  if (phone && (phone.length < 6 || phone.length > 15)) return { error: "电话号码长度不对" };

  const plan = await db.plan.findUnique({ where: { slug } });
  if (!plan) return { error: "方案不存在" };

  await db.restockAlert.create({
    data: { planId: plan.id, phoneCountry: phone ? phoneCountry : null, phone, email, wechat, usage },
  });
  return { ok: true };
}
