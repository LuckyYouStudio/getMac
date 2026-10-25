"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError } from "@/components/ui";
import { loginAction, registerAction } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : registerAction, undefined);
  const q = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {mode === "register" && (
        <label className="block">
          <span className="label">昵称</span>
          <input name="name" className="input" required maxLength={30} />
        </label>
      )}
      <label className="block">
        <span className="label">邮箱</span>
        <input name="email" type="email" className="input" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="label">密码</span>
        <input
          name="password"
          type="password"
          className="input"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      <FormError message={state?.error} />
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "请稍候…" : mode === "login" ? "登录" : "注册并登录"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>还没有账号？<Link className="text-brand hover:underline" href={`/register${q}`}>注册</Link></>
        ) : (
          <>已有账号？<Link className="text-brand hover:underline" href={`/login${q}`}>登录</Link></>
        )}
      </p>
    </form>
  );
}
