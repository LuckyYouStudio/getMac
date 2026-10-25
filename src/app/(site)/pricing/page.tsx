import Link from "next/link";
import { db } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/reservations";
import { trackView } from "@/lib/track";
import { CYCLES, cycleTotal, type Cycle } from "@/lib/constants";
import { usd } from "@/lib/format";
import { Notice } from "@/components/ui";
import { PlanCard } from "@/components/selfserve/PlanCard";

export const metadata = { title: "方案与价格" };
export const dynamic = "force-dynamic";

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ cycle?: string; name?: string }> }) {
  await releaseExpiredReservations();
  await trackView("/pricing");
  const sp = await searchParams;
  const cycle: Cycle = sp.cycle && sp.cycle in CYCLES ? (sp.cycle as Cycle) : "QUARTER";
  const plans = await db.plan.findMany({
    where: { active: true },
    orderBy: { sort: "asc" },
    include: { machines: { select: { name: true, status: true } } },
  });
  const named = sp.name ? plans.flatMap((p) => p.machines.map((m) => ({ ...m, plan: p.name }))).find((m) => m.name === sp.name) : undefined;

  const q = (c: Cycle) => {
    const p = new URLSearchParams({ cycle: c });
    if (sp.name) p.set("name", sp.name);
    return `/pricing?${p}#plans`;
  };

  return (
    <div className="container-page py-14">
      <div className="text-center">
        <div className="eyebrow">方案与价格</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy">三种配置，付得越久越省。</h1>
        <p className="mt-3 text-ink-soft">不设押金 · 到期不续即停 · 美元计价，人民币为约数</p>
      </div>

      <div id="plans" className="mt-10 flex scroll-mt-24 justify-center">
        <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
          {(Object.keys(CYCLES) as Cycle[]).map((c) => (
            <Link
              key={c}
              href={q(c)}
              scroll={false}
              className={`rounded-lg px-5 py-2 text-sm font-medium ${cycle === c ? "bg-brand text-white" : "text-ink-soft hover:bg-surface-2"}`}
            >
              {CYCLES[c].label}
              {CYCLES[c].discount > 0 && <span className={`ml-1 text-xs ${cycle === c ? "text-emerald-200" : "text-safe"}`}>省 {CYCLES[c].discount * 100}%</span>}
            </Link>
          ))}
        </div>
      </div>

      {sp.name && (
        <div className="mx-auto mt-6 max-w-xl">
          {named?.status === "AVAILABLE" ? (
            <Notice tone="ok">已为你预选机器名 <b>{named.name}</b>（{named.plan}档）。在对应档位点“立即开通”即可。</Notice>
          ) : (
            <Notice>机器名 {sp.name} 目前不可选，开通时可以挑另一台空闲的机器。</Notice>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            cycle={cycle}
            name={named && named.plan === p.name && named.status === "AVAILABLE" ? named.name : undefined}
            available={p.machines.filter((m) => m.status === "AVAILABLE").length}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        家里有闲置的 Mac？<Link className="text-brand hover:underline" href="/market/become-host">成为房东 →</Link>
        <span className="mx-2">·</span>
        想要别的地区或配置？<Link className="text-brand hover:underline" href="/market">看看租赁市场</Link>
      </p>

      <h2 className="mt-16 text-xl font-semibold text-navy">各周期价格对比</h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>档位</th><th>配置</th>{(Object.keys(CYCLES) as Cycle[]).map((c) => <th key={c}>{CYCLES[c].label}（{CYCLES[c].months} 个月）</th>)}</tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td className="text-muted">{p.spec}</td>
                {(Object.keys(CYCLES) as Cycle[]).map((c) => (
                  <td key={c}>{usd(cycleTotal(p.priceMonthly, c))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-16 text-xl font-semibold text-navy">计费说明</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[
          ["按周期预付", "月付、季付、年付三种周期，均在开通前一次性付清当期费用。季付优惠 5%，年付优惠 12%。"],
          ["不设押金", "自营方案不收押金，也没有开通费、流量费等额外费用。"],
          ["到期即停", "到期前 7 天邮件提醒。不续费则到期自动停用，数据保留 3 天后整盘抹除。"],
          ["退款规则", "开通前可全额退款；开通后按未使用的整月比例退款。详见服务条款第 5 条。"],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <div className="font-medium text-ink">{t}</div>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{d}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">详细条款见 <Link className="text-brand hover:underline" href="/terms#t5">服务条款 · 退款</Link>。</p>
    </div>
  );
}
