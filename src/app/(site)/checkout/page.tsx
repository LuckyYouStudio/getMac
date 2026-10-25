import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/reservations";
import { requireUser } from "@/lib/auth";
import { CYCLES, cycleTotal, type Cycle } from "@/lib/constants";
import { approxCny, usd } from "@/lib/format";
import { ShieldIcon } from "@/components/ui";
import { CheckoutForm } from "@/components/selfserve/CheckoutForm";

export const metadata = { title: "确认订单" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; cycle?: string; name?: string }> }) {
  await releaseExpiredReservations();
  const sp = await searchParams;
  const cycle: Cycle = sp.cycle && sp.cycle in CYCLES ? (sp.cycle as Cycle) : "MONTH";
  const qs = new URLSearchParams({ plan: sp.plan ?? "", cycle, ...(sp.name ? { name: sp.name } : {}) });
  const user = await requireUser(`/checkout?${qs}`);
  if (!sp.plan) notFound();
  const plan = await db.plan.findUnique({
    where: { slug: sp.plan },
    include: { machines: { where: { status: "AVAILABLE" }, orderBy: { name: "asc" } } },
  });
  if (!plan || !plan.active) notFound();

  const c = CYCLES[cycle];
  const full = plan.priceMonthly * c.months;
  const total = cycleTotal(plan.priceMonthly, cycle);

  return (
    <div className="container-page py-12">
      <Link href="/pricing" className="text-sm text-muted hover:text-brand">← 返回方案</Link>
      <h1 className="mt-3 text-2xl font-semibold text-navy">确认订单</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <CheckoutForm
            plan={plan.slug}
            cycle={cycle}
            machines={plan.machines}
            defaultMachine={plan.machines.some((m) => m.name === sp.name) ? sp.name : undefined}
            defaultEmail={user.email}
          />
        </div>
        <aside className="space-y-4">
          <div className="card p-6">
            <div className="text-sm text-muted">订单摘要</div>
            <div className="mt-2 text-lg font-semibold">{plan.name}档 · {c.label}</div>
            <div className="mt-1 text-sm text-muted">{plan.spec}</div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{usd(plan.priceMonthly)} × {c.months} 个月</dt><dd>{usd(full)}</dd></div>
              {c.discount > 0 && (
                <div className="flex justify-between text-safe"><dt>{c.label}优惠 {c.discount * 100}%</dt><dd>-{usd(full - total)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">押金</dt><dd>$0</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>应付</dt><dd className="text-navy">{usd(total)}</dd>
              </div>
              <div className="text-right text-xs text-muted">{approxCny(total)}</div>
            </dl>
          </div>
          <div className="card space-y-2 p-5 text-sm text-ink-soft">
            {["开通前可全额退款", "付款后 3 个工作日内交付", "到期不续即停，不自动扣费"].map((t) => (
              <div key={t} className="flex items-center gap-2"><ShieldIcon className="h-4 w-4 text-safe" />{t}</div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
