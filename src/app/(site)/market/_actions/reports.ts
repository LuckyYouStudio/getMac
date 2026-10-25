"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { REPORT_CATEGORIES, REPORT_TARGETS } from "@/lib/constants";
import { done, fail, returnTo, str } from "../_server/guards";

/** 举报：需登录，选分类；同一人对同一对象只保留一条待处理举报 */
export async function reportAction(fd: FormData) {
  const back = returnTo(fd, "/market");
  const user = await requireUser(back);
  const targetType = str(fd, "targetType");
  const targetId = str(fd, "targetId");
  const category = str(fd, "category");
  const reason = str(fd, "reason");
  if (!(targetType in REPORT_TARGETS) || !targetId) fail(back, "举报对象无效");
  if (!(category in REPORT_CATEGORIES)) fail(back, "请选择举报类型");
  if (reason.length < 4 || reason.length > 500) fail(back, "请用 4–500 字说明原因");

  // 私信只能由对话双方举报
  if (targetType === "MESSAGE") {
    const m = await db.message.findUnique({ where: { id: targetId }, include: { inquiry: true } });
    if (!m || (m.inquiry.renterId !== user.id && m.inquiry.hostId !== user.id)) fail(back, "举报对象无效");
    if (m.senderId === user.id) fail(back, "不能举报自己发的消息");
  }

  const dup = await db.report.findFirst({ where: { reporterId: user.id, targetType, targetId, status: "OPEN" } });
  if (dup) done(back, "你已经举报过，平台正在处理。");
  await db.report.create({ data: { reporterId: user.id, targetType, targetId, category, reason } });
  revalidatePath("/admin/reports");
  done(back, "举报已提交，平台会尽快核实处理。");
}
