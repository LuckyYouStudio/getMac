"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useKeepValuesSubmit } from "@/components/useKeepValuesSubmit";
import { FormError } from "@/components/ui";
import { createOrderAction } from "@/app/(site)/checkout/actions";
import { RestockDialog } from "./RestockDialog";

export function CheckoutForm({
  plan,
  planName,
  cycle,
  machines,
  defaultMachine,
  defaultEmail,
  defaultName,
  loggedIn,
  reserveMinutes,
}: {
  plan: string;
  planName: string;
  cycle: string;
  machines: { name: string; location: string; chip: string; memory: number }[];
  defaultMachine?: string;
  defaultEmail: string;
  defaultName: string;
  loggedIn: boolean;
  reserveMinutes: number;
}) {
  const [state, action, pending] = useActionState(createOrderAction, undefined);
  const submit = useKeepValuesSubmit(action);
  return (
    <form onSubmit={submit} className="space-y-6">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="cycle" value={cycle} />
      <div>
        <div className="label">给机器选个名字</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="radio" name="machine" value="" defaultChecked={!defaultMachine} className="accent-brand" />
            <div>
              <div className="text-sm font-medium">随机分配</div>
              <div className="text-xs text-muted">从 {machines.length} 台空闲机器里为你保留一台</div>
            </div>
          </label>
          {machines.map((m) => (
            <label key={m.name} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="machine" value={m.name} defaultChecked={defaultMachine === m.name} className="accent-brand" />
              <div className="min-w-0">
                <div className="text-sm font-medium">{m.name}</div>
                <div className="truncate text-xs text-muted">{m.chip} · {m.memory}GB · {m.location}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">称呼</span>
          <input name="contactName" required maxLength={40} defaultValue={defaultName} className="input" placeholder="怎么称呼你" />
        </label>
        <label className="block">
          <span className="label">交付邮箱</span>
          <input name="email" type="email" required defaultValue={defaultEmail} className="input" placeholder="you@example.com" />
        </label>
      </div>
      <p className="-mt-3 hint">连接信息和订单专属链接只发到这个邮箱，请确认能正常收信。</p>
      {!loggedIn && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs leading-5 text-muted">
          不用注册也能下单：订单会记在这个浏览器上，换设备时用邮件里的专属链接打开。已有账号？<Link className="text-brand hover:underline" href={`/login?next=${encodeURIComponent(`/checkout?plan=${plan}&cycle=${cycle}`)}`}>登录后下单</Link>，订单会关联到账号。
        </p>
      )}
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="agree" className="mt-1 accent-brand" />
        <span>
          我已阅读并同意 <Link href="/terms" target="_blank" className="text-brand hover:underline">服务条款</Link>（含 <Link href="/terms#renewal" target="_blank" className="text-brand hover:underline">自动续费</Link> 与 <Link href="/terms#t5" target="_blank" className="text-brand hover:underline">退款规则</Link>）和 <Link href="/privacy" target="_blank" className="text-brand hover:underline">隐私政策</Link>
        </span>
      </label>
      <FormError message={state?.error} />
      {state?.soldOut && <RestockDialog plan={plan} planName={planName} className="btn-outline w-full" />}
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "正在保留机器…" : "提交订单，去付款"}</button>
      <p className="text-center text-xs text-muted">提交后机器为你保留 {reserveMinutes} 分钟，期间完成付款即可</p>
    </form>
  );
}
