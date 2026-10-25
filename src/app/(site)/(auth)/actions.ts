"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { findContactInfo, isReservedName } from "@/lib/contact-guard";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "/";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "邮箱或密码不正确" };
  }
  if (user.banned) return { error: "该账号已被停用，如有疑问请联系客服" };
  await createSession(user.id);
  redirect(safeNext(fd.get("next")));
}

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "请填写昵称")
    .max(30, "昵称最多 30 字")
    .refine((n) => !isReservedName(n), "昵称不能包含“官方”“客服”“管理员”等字样")
    .refine((n) => !findContactInfo(n), "昵称里不能包含联系方式"),
  email: z.email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位"),
});

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: fd.get("name"),
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    password: fd.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "该邮箱已注册，请直接登录" };
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
