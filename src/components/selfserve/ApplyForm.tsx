"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useKeepValuesSubmit } from "@/components/useKeepValuesSubmit";
import { FormError } from "@/components/ui";
import { createLeadAction } from "@/app/(site)/apply/actions";

const COUNTRY_CODES = ["+86", "+1", "+852", "+853", "+886", "+65", "+81", "+82", "+44", "+49", "+61"];

const PLAN_OPTIONS = [
  ["unsure", "还不确定"],
  ["economy", "经济"],
  ["standard", "标准"],
  ["pro", "进阶"],
  ["custom", "定制配置"],
  ["upgrade", "升级现有订单"],
] as const;

const NEXT_STEPS = [
  "我们会在 1 个工作日内，按你留的联系方式回复。",
  "根据你的用法推荐档位；定制配置会附上报价和预计交付时间。",
  "你确认后，我们发来下单链接，或直接为你保留机器。",
  "付款后照常配机，3 个工作日内交付。",
];

export function ApplyForm({ defaultPlan, orderNo }: { defaultPlan: string; orderNo?: string }) {
  const [state, action, pending] = useActionState(createLeadAction, undefined);
  const submit = useKeepValuesSubmit(action);
  const [plan, setPlan] = useState(defaultPlan);

  if (state?.seq !== undefined) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-safe-soft p-5 text-safe">
          <div className="text-lg font-semibold">收到了{state.seq > 0 ? `，编号 #${state.seq}` : ""}。</div>
          <p className="mt-1 text-sm">工作日 1 天内回复你。期间有补充，回复时提一下编号就行。</p>
        </div>
        <div>
          <div className="font-medium text-ink">接下来会发生什么</div>
          <ol className="mt-3 space-y-2 text-sm text-ink-soft">
            {NEXT_STEPS.map((t, i) => (
              <li key={t} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs text-white">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className="btn-outline">先看看方案</Link>
          <Link href="/guide" className="btn-ghost">使用指南</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {orderNo && <input type="hidden" name="orderNo" value={orderNo} />}
      <label className="block">
        <span className="label">怎么称呼你 *</span>
        <input name="name" required maxLength={40} className="input" />
      </label>

      <fieldset>
        <legend className="label">联系方式（至少一项）*</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2 sm:col-span-2">
            <select name="phoneCountry" className="input w-24 shrink-0" defaultValue="+86">
              {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input name="phone" inputMode="tel" className="input" placeholder="电话" />
          </div>
          <input name="email" type="email" className="input" placeholder="邮箱" />
          <input name="wechat" className="input" placeholder="微信号" />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="label">团队人数 *</span>
          <select name="teamSize" required className="input" defaultValue="">
            <option value="" disabled>请选择</option>
            {["1 人", "2–4 人", "5–10 人", "10 人以上"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">希望何时开始</span>
          <select name="startWhen" className="input" defaultValue="">
            <option value="">不确定</option>
            {["越快越好", "一周内", "一个月内", "只是先了解"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">付费周期</span>
          <select name="cycle" className="input" defaultValue="">
            <option value="">不确定</option>
            <option value="MONTH">月付</option>
            <option value="QUARTER">季付</option>
            <option value="YEAR">年付</option>
          </select>
        </label>
      </div>

      <div>
        <span className="label">意向方案</span>
        <div className="flex flex-wrap gap-2">
          {PLAN_OPTIONS.map(([v, l]) => (
            <label key={v} className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand">
              <input type="radio" name="plan" value={v} checked={plan === v} onChange={() => setPlan(v)} className="sr-only" />{l}
            </label>
          ))}
        </div>
      </div>

      {plan === "custom" && (
        <div className="grid gap-4 rounded-xl border border-brand/20 bg-brand-soft/40 p-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">芯片</span>
            <select name="chip" className="input" defaultValue="M5 Pro">
              {["M4", "M4 Pro", "M5", "M5 Pro", "M6", "M6 Pro", "不确定"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">内存</span>
            <select name="memory" className="input" defaultValue="32GB">
              {["16GB", "24GB", "32GB", "48GB", "64GB", "128GB"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">存储</span>
            <select name="storage" className="input" defaultValue="512GB">
              {["256GB", "512GB", "1TB", "2TB", "4TB"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">台数</span>
            <input name="qty" type="number" min={1} max={100} defaultValue={1} className="input" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">租期</span>
            <select name="term" className="input" defaultValue="6 个月">
              {["6 个月", "12 个月", "24 个月"].map((v) => <option key={v}>{v}</option>)}
            </select>
            <span className="hint block">定制配置半年起租，单独报价。</span>
          </label>
        </div>
      )}

      <label className="block">
        <span className="label">打算用来做什么 *</span>
        <textarea name="usage" required rows={4} maxLength={1000} className="input" placeholder="比如：三个人做 iOS，常开 Xcode 和两个模拟器，同时跑 AI 编程任务" />
      </label>

      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="agree" className="mt-1 accent-brand" />
        <span>同意按 <Link href="/privacy" target="_blank" className="text-brand hover:underline">隐私政策</Link> 处理我留下的联系方式，仅用于回复这次咨询。</span>
      </label>
      <FormError message={state?.error} />
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "提交中…" : "提交"}</button>
    </form>
  );
}
