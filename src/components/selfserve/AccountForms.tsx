"use client";

import { useActionState } from "react";
import { FormError } from "@/components/ui";
import { changePasswordAction, updateProfileAction } from "@/app/(site)/account/actions";

function Ok({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-lg bg-safe-soft px-3 py-2 text-sm text-safe">{message}</p>;
}

export function ProfileForm({ name, wechat, email }: { name: string; wechat: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="label">邮箱</span><input className="input bg-surface-2" value={email} disabled /></label>
      <label className="block"><span className="label">昵称</span><input name="name" className="input" defaultValue={name} maxLength={30} required /></label>
      <label className="block">
        <span className="label">微信号（可选）</span>
        <input name="wechat" className="input" defaultValue={wechat} />
        <span className="hint block">只在你主动发给房东时可见，不会公开展示。</span>
      </label>
      <FormError message={state?.error} /><Ok message={state?.ok} />
      <button className="btn-primary" disabled={pending}>{pending ? "保存中…" : "保存资料"}</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="label">当前密码</span><input name="current" type="password" className="input" required autoComplete="current-password" /></label>
      <label className="block"><span className="label">新密码</span><input name="next" type="password" className="input" required minLength={8} autoComplete="new-password" /></label>
      <FormError message={state?.error} /><Ok message={state?.ok} />
      <button className="btn-outline" disabled={pending}>{pending ? "更新中…" : "修改密码"}</button>
    </form>
  );
}
