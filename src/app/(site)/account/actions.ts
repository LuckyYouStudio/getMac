"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { findContactInfo, isReservedName } from "@/lib/contact-guard";

export type AccountState = { error?: string; ok?: string } | undefined;

export async function updateProfileAction(_: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireUser("/account");
  const name = String(fd.get("name") ?? "").trim();
  const wechat = String(fd.get("wechat") ?? "").trim();
  const bio = String(fd.get("bio") ?? "").trim();
  if (!name) return { error: "昵称不能为空" };
  if (name.length > 30) return { error: "昵称最多 30 字" };
  if (bio.length > 300) return { error: "简介最多 300 字" };
  // 管理员账号可以使用“站务”等官方字样
  if (user.role !== "ADMIN" && isReservedName(name)) return { error: "昵称不能包含“官方”“客服”“管理员”等字样" };
  const hit = findContactInfo(name, bio);
  if (hit) return { error: `公开资料里不能留联系方式（检测到${hit}），联系请走站内对话` };
  await db.user.update({ where: { id: user.id }, data: { name, wechat: wechat || null, bio: bio || null } });
  revalidatePath("/", "layout");
  return { ok: "已保存" };
}

export async function changePasswordAction(_: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireUser("/account");
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "当前密码不正确" };
  if (next.length < 8) return { error: "新密码至少 8 位" };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  return { ok: "密码已更新" };
}
