"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError } from "@/components/ui";
import { createOrderAction } from "@/app/(site)/checkout/actions";

export function CheckoutForm({
  plan,
  cycle,
  machines,
  defaultMachine,
  defaultEmail,
}: {
  plan: string;
  cycle: string;
  machines: { name: string; location: string; chip: string; memory: number }[];
  defaultMachine?: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(createOrderAction, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="cycle" value={cycle} />
      <div>
        <div className="label">给机器选个名字</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="radio" name="machine" value="" defaultChecked={!defaultMachine} className="accent-brand" />
            <div>
              <div className="text-sm font-medium">随机分配</div>
              <div className="text-xs text-muted">由我们挑一台空闲机器</div>
            </div>
          </label>
          {machines.map((m) => (
            <label key={m.name} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="machine" value={m.name} defaultChecked={defaultMachine === m.name} className="accent-brand" />
              <div>
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-muted">{m.chip} · {m.memory}GB · {m.location}</div>
              </div>
            </label>
          ))}
        </div>
        {machines.length === 0 && <p className="hint">这一档暂时没有可指定名字的现货，可以随机分配，我们会尽快补货。</p>}
      </div>
      <label className="block">
        <span className="label">交付邮箱</span>
        <input name="email" type="email" required defaultValue={defaultEmail} className="input" />
        <span className="hint block">连接信息只会发到这个邮箱，请确认可以正常收信。</span>
      </label>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="agree" className="mt-1 accent-brand" />
        <span>我已阅读并同意 <Link href="/terms" target="_blank" className="text-brand hover:underline">服务条款</Link> 与 <Link href="/privacy" target="_blank" className="text-brand hover:underline">隐私政策</Link></span>
      </label>
      <FormError message={state?.error} />
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "正在创建订单…" : "提交订单，去付款"}</button>
      <p className="text-center text-xs text-muted">提交后机器为你保留 30 分钟</p>
    </form>
  );
}
