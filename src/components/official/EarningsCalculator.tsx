"use client";

import { useState } from "react";
import { CYCLES, OFFICIAL_HOST_FEE, planMonthly, type Cycle } from "@/lib/constants";

type CalcPlan = { slug: string; name: string; spec: string; priceMonth: number; priceQuarter: number; priceYear: number };

/** 官方房东收益计算器：客户实付 − 每台每月平台服务费 */
export function EarningsCalculator({ plans }: { plans: CalcPlan[] }) {
  const [slug, setSlug] = useState(plans.find((p) => p.slug === "standard")?.slug ?? plans[0]?.slug);
  const [cycle, setCycle] = useState<Cycle>("QUARTER");
  const [months, setMonths] = useState(10);
  const plan = plans.find((p) => p.slug === slug) ?? plans[0];
  if (!plan) return null;

  const monthly = planMonthly(plan, cycle);
  const gross = monthly * months;
  const fee = OFFICIAL_HOST_FEE * months;
  const net = gross - fee;

  return (
    <div className="card grid gap-6 p-6 md:grid-cols-[1.1fr_1fr]">
      <div className="space-y-5">
        <div>
          <div className="label">你的机器属于哪一档</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {plans.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setSlug(p.slug)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  p.slug === slug ? "border-brand bg-brand-soft text-brand-dark" : "border-line-strong hover:border-brand"
                }`}
              >
                <div className="font-medium">{p.name}档</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-muted">{p.spec}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label">租客通常怎么付</div>
          <div className="inline-flex rounded-lg border border-line-strong p-0.5">
            {(Object.keys(CYCLES) as Cycle[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={`rounded-md px-3 py-1.5 text-sm ${c === cycle ? "bg-brand text-white" : "text-ink-soft"}`}
              >
                {CYCLES[c].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label flex justify-between">
            <span>一年里大约租出几个月</span>
            <span className="font-semibold text-ink">{months} 个月</span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-[var(--color-brand)]"
          />
          <p className="hint">空置的月份不收服务费，也没有收入。</p>
        </div>
      </div>

      <div className="rounded-xl bg-surface-2 p-5">
        <div className="text-sm text-muted">一年预计到手</div>
        <div className="mt-1 text-4xl font-semibold text-safe">${net.toLocaleString()}</div>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">客户实付（${monthly}/月 × {months}）</dt>
            <dd>${gross.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">平台服务费（${OFFICIAL_HOST_FEE}/月 × {months}）</dt>
            <dd>−${fee.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-medium">
            <dt>你的分成</dt>
            <dd>${net.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted">
          按 {plan.name}档{CYCLES[cycle].label}的月均价估算，未扣电费、网费和税。实际以每月结算单为准。
        </p>
      </div>
    </div>
  );
}
