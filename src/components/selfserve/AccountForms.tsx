"use client";

import { useActionState } from "react";
import { FormError } from "@/components/ui";
import { changePasswordAction, updateProfileAction } from "@/app/(site)/account/actions";

function Ok({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-lg bg-safe-soft px-3 py-2 text-sm text-safe">{message}</p>;
}

export function ProfileForm({ name, wechat, bio, email }: { name: string; wechat: string; bio: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="label">邮箱</span><input className="input bg-surface-2" value={email} disabled /></label>
      <label className="block">
        <span className="label">昵称</span>
        <input name="name" className="input" defaultValue={name} maxLength={30} required />
        <span className="hint block">公开展示。不能包含联系方式，也不能使用“官方”“客服”“管理员”等字样。</span>
      </label>
      <label className="block">
        <span className="label">公开简介（选填）</span>
        <textarea name="bio" rows={3} maxLength={300} className="input" defaultValue={bio} placeholder="比如：机器放在哪、网络情况、擅长什么" />
        <span className="hint block">会显示在你的房东主页上，同样不能留联系方式。</span>
      </label>
      <label className="block">
        <span className="label">微信号（选填，不公开）</span>
        <input name="wechat" className="input" defaultValue={wechat} />
        <span className="hint block">只用于我们联系你，不会展示给其他用户。</span>
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
