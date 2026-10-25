"use server";

import { db } from "@/lib/db";

export type ApplyState = { error?: string; seq?: number } | undefined;

const PLANS = ["economy", "standard", "pro", "custom", "unsure", "upgrade"];

function s(fd: FormData, k: string, max = 200) {
  return String(fd.get(k) ?? "").trim().slice(0, max) || null;
}

/** 联系我们 / 定制配置需求，写入线索表 */
export async function createLeadAction(_: ApplyState, fd: FormData): Promise<ApplyState> {
  // 蜜罐字段：真人看不到，机器人会填
  if (s(fd, "website")) return { seq: 0 };

  const name = s(fd, "name", 40);
  const phone = s(fd, "phone", 30)?.replace(/[^\d]/g, "") || null;
  const email = s(fd, "email", 120)?.toLowerCase() ?? null;
  const wechat = s(fd, "wechat", 40);
  const teamSize = s(fd, "teamSize", 20);
  const usage = s(fd, "usage", 1000);
  const plan = s(fd, "plan", 20);

  if (!name) return { error: "请填写称呼" };
  if (!phone && !email && !wechat) return { error: "电话、邮箱、微信至少留一项" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "邮箱格式不正确" };
  if (!teamSize) return { error: "请选择团队人数" };
  if (!usage || usage.length < 4) return { error: "请简单说说打算用来做什么" };
  if (plan && !PLANS.includes(plan)) return { error: "意向方案无效" };
  if (fd.get("agree") !== "on") return { error: "请先同意隐私政策" };

  const custom = plan === "custom";
  const qty = Number(fd.get("qty"));
  const data = {
    name,
    phoneCountry: phone ? s(fd, "phoneCountry", 6) : null,
    phone,
    email,
    wechat,
    teamSize,
    startWhen: s(fd, "startWhen", 40),
    cycle: s(fd, "cycle", 20),
    plan,
    chip: custom ? s(fd, "chip", 20) : null,
    memory: custom ? s(fd, "memory", 20) : null,
    storage: custom ? s(fd, "storage", 20) : null,
    qty: custom && Number.isInteger(qty) && qty > 0 ? Math.min(qty, 100) : null,
    term: custom ? s(fd, "term", 20) : null,
    usage: [s(fd, "orderNo", 40) ? `[关联订单 ${s(fd, "orderNo", 40)}] ` : "", usage].join(""),
  };

  // 编号 #N 递增；并发撞号时重试
  for (let i = 0; i < 3; i++) {
    try {
      const last = await db.lead.findFirst({ orderBy: { seq: "desc" }, select: { seq: true } });
      const lead = await db.lead.create({ data: { ...data, seq: (last?.seq ?? 0) + 1 } });
      return { seq: lead.seq };
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  return { error: "提交失败，请稍后再试" };
}
