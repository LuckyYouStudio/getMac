import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/reservations";
import { getCurrentUser } from "@/lib/auth";
import { CYCLES, REFUND_WINDOW_HOURS, RESERVE_MINUTES, cycleTotal, isCycle, planMonthly, type Cycle } from "@/lib/constants";
import { approxCny, usd } from "@/lib/format";
import { Notice, ShieldIcon } from "@/components/ui";
import { CheckoutForm } from "@/components/selfserve/CheckoutForm";
import { RestockDialog } from "@/components/selfserve/RestockDialog";

export const metadata = { title: "确认订单" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; cycle?: string; name?: string }> }) {
  await releaseExpiredReservations();
  const sp = await searchParams;
  const cycle: Cycle = isCycle(sp.cycle) ? sp.cycle : "MONTH";
  if (!sp.plan) notFound();
  const [user, plan] = await Promise.all([
    getCurrentUser(),
    db.plan.findUnique({
      where: { slug: sp.plan },
      include: { machines: { where: { status: "AVAILABLE" }, orderBy: { name: "asc" } } },
    }),
  ]);
  if (!plan || !plan.active) notFound();

  const c = CYCLES[cycle];
  const monthly = planMonthly(plan, cycle);
  const total = cycleTotal(plan, cycle);
  const atMonthly = plan.priceMonth * c.months;
  const soldOut = plan.machines.length === 0;

  return (
    <div className="container-page py-12">
      <Link href={`/pricing?cycle=${cycle}#plans`} className="text-sm text-muted hover:text-brand">← 返回方案</Link>
      <h1 className="mt-3 text-2xl font-semibold text-navy">确认订单</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          {soldOut ? (
            <div className="space-y-4">
              <Notice>{plan.name}档暂时没有空闲机器，现在不能下单。登记到货通知，有货时第一时间联系你。</Notice>
              <RestockDialog plan={plan.slug} planName={plan.name} />
              <div className="flex flex-wrap gap-3 text-sm">
                <Link className="text-brand hover:underline" href="/pricing#plans">看看其他档位</Link>
                <Link className="text-brand hover:underline" href="/market">去租赁市场找找</Link>
              </div>
            </div>
          ) : (
            <CheckoutForm
              plan={plan.slug}
              planName={plan.name}
              cycle={cycle}
              machines={plan.machines}
              defaultMachine={plan.machines.some((m) => m.name === sp.name) ? sp.name : undefined}
              defaultEmail={user?.email ?? ""}
              defaultName={user?.name ?? ""}
              loggedIn={!!user}
              reserveMinutes={RESERVE_MINUTES}
            />
          )}
        </div>
        <aside className="space-y-4">
          <div className="card p-6">
            <div className="text-sm text-muted">订单摘要</div>
            <div className="mt-2 text-lg font-semibold">{plan.name}档 · {c.label}</div>
            <div className="mt-1 text-sm text-muted">{plan.spec}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Object.keys(CYCLES) as Cycle[]).map((k) => (
                <Link
                  key={k}
                  href={`/checkout?${new URLSearchParams({ plan: plan.slug, cycle: k, ...(sp.name ? { name: sp.name } : {}) })}`}
                  replace
                  className={`rounded-md border px-2.5 py-1 text-xs ${k === cycle ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-soft hover:border-brand"}`}
                >
                  {CYCLES[k].label}
                </Link>
              ))}
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{usd(monthly)} × {c.months} 个月</dt><dd>{usd(total)}</dd></div>
              {atMonthly > total && (
                <div className="flex justify-between text-safe"><dt>比按月付节省</dt><dd>-{usd(atMonthly - total)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">押金</dt><dd>$0</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>本期应付</dt><dd className="text-navy">{usd(total)}</dd>
              </div>
              <div className="text-right text-xs text-muted">{approxCny(total)}</div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-muted">
              默认开启自动续费，到期按{c.label}续上同一台机器；可以随时在订单页关闭。
            </p>
          </div>
          <div className="card space-y-2 p-5 text-sm text-ink-soft">
            {[
              "交付前随时取消，全额退款",
              `交付后 ${REFUND_WINDOW_HOURS} 小时内因我们的原因无法使用，全额退款`,
              "付款后 3 个工作日内交付",
              "不设押金，关闭自动续费即到期停用",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2"><ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-safe" />{t}</div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
