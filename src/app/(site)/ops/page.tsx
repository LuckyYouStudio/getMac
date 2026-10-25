import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MACHINE_STATUS, OFFICIAL_HOST_FEE, PAYOUT_STATUS } from "@/lib/constants";
import { ago, date, usd } from "@/lib/format";
import { parseJson } from "@/lib/json";
import { Badge, Empty, Notice, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { CHECKLIST, isOnline } from "@/components/official/checklist";

export default async function OpsHome() {
  const user = await requireUser("/ops");
  const now = new Date();
  const [machines, payouts] = await Promise.all([
    db.machine.findMany({
      where: { ownerId: user.id },
      include: {
        plan: true,
        // 当前生效的订单，用于估算本月收入
        orders: { where: { status: "DELIVERED", startAt: { lte: now }, endAt: { gte: now } }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.payout.findMany({ where: { hostId: user.id }, orderBy: { month: "desc" }, take: 12 }),
  ]);

  // 本月预估：在租机器按订单月均实付 − 每台服务费
  const rented = machines.filter((m) => m.orders.length > 0);
  const gross = rented.reduce((s, m) => s + Math.round(m.orders[0].amount / m.orders[0].months), 0);
  const estimate = gross - OFFICIAL_HOST_FEE * rented.length;
  const paidTotal = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.net, 0);
  const offline = machines.filter((m) => m.status !== "ONBOARDING" && m.status !== "RETIRED" && !isOnline(m.heartbeatAt));

  return (
    <div className="space-y-8">
      <PageHeader
        title="概览"
        desc="机器在线、按时结算。出租期间请不要登录租客的环境。"
        actions={<Link href="/ops/machines/new" className="btn-primary">登记新机器</Link>}
      />

      {!user.payoutInfo && (
        <Notice tone="warn">
          还没有填写收款信息，结算时无法打款。<Link href="/ops/payout" className="ml-1 underline">现在填写</Link>
        </Notice>
      )}
      {offline.length > 0 && (
        <Notice tone="warn">
          {offline.map((m) => m.name).join("、")} 超过 10 分钟没有心跳，请检查电源和网络。
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="我的机器" value={machines.length} sub={`出租中 ${rented.length} 台`} />
        <Stat label="本月预估分成" value={usd(Math.max(estimate, 0))} sub={`客户实付 ${usd(gross)} − 服务费 ${usd(OFFICIAL_HOST_FEE * rented.length)}`} />
        <Stat label="累计已打款" value={usd(paidTotal)} />
        <Stat label="在线" value={`${machines.filter((m) => isOnline(m.heartbeatAt)).length} / ${machines.length}`} sub="10 分钟内有心跳算在线" />
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-ink">我的机器</h2>
        {machines.length === 0 ? (
          <Empty>
            还没有登记机器。<Link href="/ops/machines/new" className="text-brand hover:underline">登记第一台</Link>
          </Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table min-w-[640px]">
              <thead>
                <tr><th>名字</th><th>配置 / 档位</th><th>状态</th><th>心跳</th><th>上架清单</th><th></th></tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const list = parseJson<Record<string, boolean>>(m.checklist, {});
                  const done = CHECKLIST.filter((c) => (c.auto ? !!m.heartbeatAt : list[c.key])).length;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted">{m.location}</div>
                      </td>
                      <td>
                        <div>{m.chip} · {m.memory}GB · {m.storage >= 1024 ? `${m.storage / 1024}TB` : `${m.storage}GB`}</div>
                        <div className="text-xs text-muted">{m.plan.name}档</div>
                      </td>
                      <td><StatusBadge map={MACHINE_STATUS} value={m.status} /></td>
                      <td>
                        {m.heartbeatAt ? (
                          <span className="flex items-center gap-1.5 text-sm">
                            <span className={`h-2 w-2 rounded-full ${isOnline(m.heartbeatAt) ? "bg-safe" : "bg-danger"}`} />
                            {ago(m.heartbeatAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">尚未上报</span>
                        )}
                      </td>
                      <td>
                        {m.status === "ONBOARDING" ? (
                          list.submitted ? <Badge tone="info">已提交，待验收</Badge> : <span className="text-sm">{done} / {CHECKLIST.length}</span>
                        ) : (
                          <span className="text-xs text-muted">已完成</span>
                        )}
                      </td>
                      <td className="text-right"><Link href={`/ops/machines/${m.id}`} className="btn-outline btn-sm">管理</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-ink">月度结算</h2>
        <p className="mb-3 text-sm text-muted">每月 1 日生成上月结算单，10 日前打款。</p>
        {payouts.length === 0 ? (
          <Empty>还没有结算记录。机器第一次租出后的次月会出现在这里。</Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table min-w-[520px]">
              <thead>
                <tr><th>月份</th><th>客户实付</th><th>服务费</th><th>你的分成</th><th>状态</th></tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.month}</td>
                    <td>{usd(p.gross)}</td>
                    <td>−{usd(p.fee)}</td>
                    <td className="font-medium text-safe">{usd(p.net)}</td>
                    <td>
                      <StatusBadge map={PAYOUT_STATUS} value={p.status} />
                      {p.paidAt && <span className="ml-2 text-xs text-muted">{date(p.paidAt)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
