import Link from "next/link";
import { db } from "@/lib/db";
import { OFFICIAL_HOST_FEE, PAYOUT_STATUS } from "@/lib/constants";
import { dateTime, usd } from "@/lib/format";
import { Empty, Notice, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { Heartbeat } from "@/components/admin/Bits";
import { generatePayouts, markPayoutPaid } from "../actions/business";

export const metadata = { title: "官方房东结算" };

function lastMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PayoutsPage({ searchParams }: { searchParams: Promise<{ month?: string; made?: string; error?: string }> }) {
  const { month = "", made, error } = await searchParams;
  const [hosts, payouts] = await Promise.all([
    db.user.findMany({
      where: { officialHost: true },
      include: { ownedMachines: { orderBy: { name: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.payout.findMany({ where: month ? { month } : {}, include: { host: true }, orderBy: [{ month: "desc" }, { createdAt: "asc" }], take: 200 }),
  ]);
  const pending = payouts.filter((p) => p.status === "PENDING");

  return (
    <div className="space-y-6">
      <PageHeader title="官方房东结算" desc={`客户实付减去每台每月 ${usd(OFFICIAL_HOST_FEE)} 平台服务费，其余归房东，按月结算。`} />
      <ErrorBanner error={error} />
      {made !== undefined && <Notice tone="ok">已生成或更新 {made} 条 {month} 的结算（已打款的不会被覆盖）。</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="官方房东" value={hosts.length} />
        <Stat label="托管机器" value={hosts.reduce((s, h) => s + h.ownedMachines.length, 0)} sub={`待上架 ${hosts.reduce((s, h) => s + h.ownedMachines.filter((m) => m.status === "ONBOARDING").length, 0)}`} />
        <Stat label="待打款" value={pending.length} sub={usd(pending.reduce((s, p) => s + p.net, 0))} />
        <Stat label="已打款（列表内）" value={usd(payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.net, 0))} />
      </div>

      <form action={generatePayouts} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="block">
          <span className="label">结算月份</span>
          <input name="month" type="month" required defaultValue={month || lastMonth()} className="input w-48" />
        </label>
        <SubmitButton className="btn-primary">生成 / 更新结算</SubmitButton>
        <p className="text-xs text-muted">按该月付款的订单计算；已打款的结算不会被覆盖。</p>
      </form>

      <section className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <h2 className="font-semibold">结算记录 {month && <span className="text-sm font-normal text-muted">· {month}</span>}</h2>
          {month && <Link href="/admin/payouts" className="text-sm text-brand hover:underline">查看全部月份</Link>}
        </div>
        {payouts.length === 0 ? (
          <div className="px-5 pb-5"><Empty>还没有结算记录</Empty></div>
        ) : (
          <table className="table">
            <thead><tr><th>月份</th><th>房东</th><th>客户实付</th><th>服务费</th><th>应付房东</th><th>收款信息</th><th>状态</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono">{p.month}</td>
                  <td><Link href={`/admin/users/${p.host.id}`} className="hover:text-brand">{p.host.name}</Link><div className="text-xs text-muted">{p.host.email}</div></td>
                  <td>{usd(p.gross)}</td>
                  <td className="text-muted">−{usd(p.fee)}</td>
                  <td className="font-semibold">{usd(p.net)}</td>
                  <td className="max-w-48 text-xs text-ink-soft">{p.host.payoutInfo || <span className="text-warn">未填写</span>}</td>
                  <td><StatusBadge map={PAYOUT_STATUS} value={p.status} />{p.paidAt && <div className="text-xs text-muted">{dateTime(p.paidAt)}</div>}</td>
                  <td className="text-right">
                    {p.status === "PENDING" && (
                      <form action={markPayoutPaid}>
                        <input type="hidden" name="id" value={p.id} />
                        <SubmitButton className="btn-safe btn-sm" confirm={`确认已向 ${p.host.name} 打款 ${usd(p.net)}？`}>标记已打款</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="px-5 pt-4 font-semibold">官方房东与托管机器</h2>
        {hosts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">还没有官方房东</p>
        ) : (
          <table className="table mt-2">
            <thead><tr><th>房东</th><th>签署协议</th><th>机器</th></tr></thead>
            <tbody>
              {hosts.map((h) => (
                <tr key={h.id}>
                  <td><Link href={`/admin/users/${h.id}`} className="hover:text-brand">{h.name}</Link><div className="text-xs text-muted">{h.email}</div></td>
                  <td className="text-muted">{dateTime(h.hostAgreedAt)}</td>
                  <td>
                    {h.ownedMachines.length === 0 ? (
                      <span className="text-muted">未登记</span>
                    ) : (
                      <ul className="space-y-1">
                        {h.ownedMachines.map((m) => (
                          <li key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                            <Link href={`/admin/machines/${m.id}`} className="font-medium text-brand hover:underline">{m.name}</Link>
                            <span className="text-muted">{m.chip} {m.memory}G</span>
                            <Heartbeat at={m.heartbeatAt} />
                            {m.status === "ONBOARDING" && <span className="text-xs text-warn">待上架</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
