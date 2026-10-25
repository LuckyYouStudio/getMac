import Link from "next/link";
import { CYCLES, cycleTotal, type Cycle } from "@/lib/constants";
import { approxCny, usd } from "@/lib/format";
import { CheckIcon } from "@/components/ui";

type Plan = { slug: string; name: string; badge: string | null; spec: string; priceMonthly: number; summary: string; featured: boolean };

export function PlanCard({ plan, cycle, name, available }: { plan: Plan; cycle: Cycle; name?: string; available?: number }) {
  const c = CYCLES[cycle];
  const total = cycleTotal(plan.priceMonthly, cycle);
  const perMonth = Math.round(total / c.months);
  const q = new URLSearchParams({ plan: plan.slug, cycle });
  if (name) q.set("name", name);
  return (
    <div className={`card relative flex flex-col p-6 ${plan.featured ? "border-brand ring-2 ring-brand/15" : ""}`}>
      {plan.badge && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-medium text-white">{plan.badge}</span>
      )}
      <div className="text-lg font-semibold text-ink">{plan.name}</div>
      <div className="mt-1 text-sm text-muted">{plan.spec}</div>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-navy">{usd(perMonth)}</span>
        <span className="text-sm text-muted">/ 月</span>
      </div>
      <div className="mt-1 text-xs text-muted">
        {c.months > 1 ? `${c.label}预付 ${usd(total)} · ` : ""}
        {approxCny(perMonth)}/月
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-soft">{plan.summary}</p>
      <ul className="mt-4 space-y-2 text-sm text-ink-soft">
        {["实体机独享，完整管理员权限", "开发环境预装", "不设押金，到期不续即停"].map((t) => (
          <li key={t} className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-safe" />{t}</li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <Link href={`/checkout?${q}`} className={`${plan.featured ? "btn-primary" : "btn-outline"} w-full`}>立即开通</Link>
        <p className="mt-2 text-center text-xs text-muted">
          付款后 3 个工作日内开通{typeof available === "number" ? ` · 现货 ${available} 台` : ""}
        </p>
      </div>
    </div>
  );
}
