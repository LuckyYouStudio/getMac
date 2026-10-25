import Link from "next/link";
import { CYCLES, cycleTotal, planMonthly, savingPct, type Cycle } from "@/lib/constants";
import { approxCny, usd } from "@/lib/format";
import { parseList } from "@/lib/json";
import { CheckIcon } from "@/components/ui";
import { RestockDialog } from "./RestockDialog";

export type PlanForCard = {
  slug: string;
  name: string;
  badge: string | null;
  spec: string;
  priceMonth: number;
  priceQuarter: number;
  priceYear: number;
  summary: string;
  features: string;
  responseHours: number;
  featured: boolean;
};

export function PlanCard({
  plan,
  cycle,
  name,
  available,
  notify = false,
}: {
  plan: PlanForCard;
  cycle: Cycle;
  /** 预选的机器名 */
  name?: string;
  /** 空闲机器数；为 0 时显示缺货 */
  available: number;
  /** 打开页面时直接弹出到货通知 */
  notify?: boolean;
}) {
  const c = CYCLES[cycle];
  const perMonth = planMonthly(plan, cycle);
  const total = cycleTotal(plan, cycle);
  const save = savingPct(plan, cycle);
  const soldOut = available === 0;
  const q = new URLSearchParams({ plan: plan.slug, cycle });
  if (name) q.set("name", name);
  const features = parseList(plan.features);

  return (
    <div className={`card relative flex flex-col p-6 ${plan.featured && !soldOut ? "border-brand ring-2 ring-brand/15" : ""}`}>
      {plan.badge && !soldOut && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-medium text-white">{plan.badge}</span>
      )}
      {soldOut && (
        <span className="absolute -top-3 left-6 rounded-full bg-warn px-3 py-0.5 text-xs font-medium text-white">暂时缺货</span>
      )}
      <div className="text-lg font-semibold text-ink">{plan.name}</div>
      <div className="mt-1 text-sm text-muted">{plan.spec}</div>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-navy">{usd(perMonth)}</span>
        <span className="text-sm text-muted">/ 月</span>
        {save > 0 && <span className="ml-2 rounded-full bg-safe-soft px-2 py-0.5 text-xs text-safe">比月付省 {save}%</span>}
      </div>
      <div className="mt-1 text-xs text-muted">
        {c.months > 1 ? `${c.label}一次预付 ${usd(total)} · ` : "按月预付 · "}
        {approxCny(perMonth)}/月
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-soft">{plan.summary}</p>
      <ul className="mt-4 space-y-2 text-sm text-ink-soft">
        {features.map((t) => (
          <li key={t} className="flex items-start gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-safe" />{t}</li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        {soldOut ? (
          <>
            <RestockDialog plan={plan.slug} planName={plan.name} defaultOpen={notify} />
            <div className="mt-3 space-y-1 text-center text-xs text-muted">
              <div>着急用？<Link className="text-brand hover:underline" href="/market">先看看租赁市场 →</Link></div>
              <div>家里有这档机器？<Link className="text-brand hover:underline" href="/join">成为官方房东 →</Link></div>
            </div>
          </>
        ) : (
          <>
            <Link href={`/checkout?${q}`} className={`${plan.featured ? "btn-primary" : "btn-outline"} w-full`}>立即开通</Link>
            <p className="mt-2 text-center text-xs text-muted">
              现货 {available} 台 · 付款后 3 个工作日内交付 · 工单 {plan.responseHours} 小时内回复
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** 月付 / 季付 / 年付切换条，链接由调用方生成 */
export function CycleTabs({ cycle, href, savings }: { cycle: Cycle; href: (c: Cycle) => string; savings: Record<Cycle, number> }) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
      {(Object.keys(CYCLES) as Cycle[]).map((c) => (
        <Link
          key={c}
          href={href(c)}
          scroll={false}
          replace
          className={`rounded-lg px-4 py-2 text-sm font-medium sm:px-5 ${cycle === c ? "bg-brand text-white" : "text-ink-soft hover:bg-surface-2"}`}
        >
          {CYCLES[c].label}
          {savings[c] > 0 && <span className={`ml-1 text-xs ${cycle === c ? "text-emerald-200" : "text-safe"}`}>省 {savings[c]}% 起</span>}
        </Link>
      ))}
    </div>
  );
}
