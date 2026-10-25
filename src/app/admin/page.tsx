import Link from "next/link";
import { db } from "@/lib/db";
import { ORDER_STATUS, REPORT_CATEGORIES, REPORT_TARGETS } from "@/lib/constants";
import { date, dateTime, usd } from "@/lib/format";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { releaseExpiredReservations } from "@/lib/reservations";
import { PageHeader, Stat, StatusBadge } from "@/components/ui";
import { BarChart } from "@/components/admin/BarChart";
import { OrderBuyer } from "@/components/admin/Bits";

export const metadata = { title: "数据看板" };

const PAID = ["PAID", "PROVISIONING", "DELIVERED", "EXPIRED"];

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => date(new Date(Date.now() - (13 - i) * 86400000)));
}

export default async function AdminDashboard() {
  await Promise.all([expireStaleMarket(), releaseExpiredReservations()]);
  const days = last14Days();
  const since = new Date(Date.now() - 14 * 86400000);
  const [
    users, officialHosts, restricted, active, revenue, machinesFree, machinesAll, published, needsChanges, openReports,
    views, recentOrders, toProvision, onboarding, leads, restock, reports, latest, pendingPosts,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { officialHost: true } }),
    db.user.count({ where: { OR: [{ restricted: true }, { banned: true }] } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.order.aggregate({ _sum: { amount: true }, where: { status: { in: PAID } } }),
    db.machine.count({ where: { status: "AVAILABLE" } }),
    db.machine.count({ where: { status: { notIn: ["ONBOARDING", "RETIRED"] } } }),
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.listing.count({ where: { status: "NEEDS_CHANGES" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.pageView.findMany({ where: { day: { in: days } } }),
    db.order.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.order.findMany({ where: { status: { in: ["PAID", "PROVISIONING"] } }, include: { plan: true }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.machine.findMany({ where: { status: "ONBOARDING" }, include: { owner: true }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.lead.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.restockAlert.findMany({ where: { status: "OPEN" }, include: { plan: true }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.report.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.order.findMany({ include: { plan: true, user: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.communityPost.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" }, take: 5 }),
  ]);

  const viewSeries = days.map((d) => ({ label: d, value: views.filter((v) => v.day === d).reduce((s, v) => s + v.count, 0) }));
  const orderSeries = days.map((d) => ({ label: d, value: recentOrders.filter((o) => date(o.createdAt) === d).length }));
  const totalViews = viewSeries.reduce((s, v) => s + v.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="数据看板" desc={`截至 ${dateTime(new Date())}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="注册用户" value={users} sub={`官方房东 ${officialHosts} · 受限/暂停 ${restricted}`} />
        <Stat label="使用中租约" value={active} sub="自营 · 已交付" />
        <Stat label="累计收入" value={usd(revenue._sum.amount ?? 0)} sub="已付款订单" />
        <Stat label="空闲设备" value={`${machinesFree} / ${machinesAll}`} sub={`待上架 ${onboarding.length}`} />
        <Stat label="市场方案" value={published} sub={`需修改 ${needsChanges}`} />
        <Stat label="待处理举报" value={openReports} sub={openReports ? "请尽快处理" : "暂无"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">近 14 天浏览量</h2>
            <span className="text-xs text-muted">合计 {totalViews.toLocaleString()}</span>
          </div>
          <BarChart data={viewSeries} />
        </div>
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">近 14 天新订单</h2>
            <span className="text-xs text-muted">合计 {recentOrders.length}</span>
          </div>
          <BarChart data={orderSeries} color="var(--color-safe)" unit=" 单" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Todo title="待配机订单" href="/admin/orders?status=PAID" empty="没有待配机订单">
          {toProvision.map((o) => (
            <TodoItem key={o.id} href={`/admin/orders/${o.id}`} title={`${o.no} · ${o.plan.name}`} sub={`${o.deliveryEmail} · ${ORDER_STATUS[o.status].label}`} />
          ))}
        </Todo>
        <Todo title="官方房东待上架机器" href="/admin/machines?status=ONBOARDING" empty="没有待上架机器">
          {onboarding.map((m) => (
            <TodoItem key={m.id} href={`/admin/machines/${m.id}`} title={`${m.name} · ${m.chip}`} sub={`${m.owner?.name ?? "—"} · 登记于 ${date(m.createdAt)}`} />
          ))}
        </Todo>
        <Todo title="新线索" href="/admin/leads" empty="没有新线索">
          {leads.map((l) => (
            <TodoItem key={l.id} href="/admin/leads" title={`#${l.seq} ${l.name} · ${l.teamSize}`} sub={l.usage} />
          ))}
        </Todo>
        <Todo title="到货通知" href="/admin/restock" empty="没有等待中的登记">
          {restock.map((r) => (
            <TodoItem key={r.id} href="/admin/restock" title={`${r.plan.name}档 · ${r.email ?? r.wechat ?? r.phone ?? "—"}`} sub={`${date(r.createdAt)} · ${r.usage ?? ""}`} />
          ))}
        </Todo>
        <Todo title="待处理举报" href="/admin/reports" empty="没有待处理举报">
          {reports.map((r) => (
            <TodoItem key={r.id} href="/admin/reports" title={`${REPORT_CATEGORIES[r.category] ?? r.category} · ${r.reason}`} sub={`${REPORT_TARGETS[r.targetType] ?? r.targetType} · ${date(r.createdAt)}`} />
          ))}
        </Todo>
        <Todo title="待审核帖子" href="/admin/community?status=PENDING" empty="没有待审核帖子">
          {pendingPosts.map((p) => (
            <TodoItem key={p.id} href="/admin/community?status=PENDING" title={p.title} sub={`${p.user.name} · ${date(p.createdAt)}`} />
          ))}
        </Todo>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">最新订单</h2>
          <Link href="/admin/orders" className="text-sm text-brand hover:underline">全部订单 →</Link>
        </div>
        <table className="table">
          <thead>
            <tr><th>订单号</th><th>下单人</th><th>方案</th><th>金额</th><th>状态</th><th>下单时间</th></tr>
          </thead>
          <tbody>
            {latest.map((o) => (
              <tr key={o.id}>
                <td><Link className="font-mono text-brand hover:underline" href={`/admin/orders/${o.id}`}>{o.no}</Link></td>
                <td><OrderBuyer user={o.user} contactName={o.contactName} email={o.deliveryEmail} /></td>
                <td>{o.plan.name} · {o.months} 个月</td>
                <td>{usd(o.amount)}</td>
                <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                <td className="text-muted">{dateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Todo({ title, href, empty, children }: { title: string; href: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link href={href} className="text-xs text-brand hover:underline">查看</Link>
      </div>
      {children.length ? <ul className="divide-y divide-line">{children}</ul> : <p className="py-4 text-center text-xs text-muted">{empty}</p>}
    </div>
  );
}

function TodoItem({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <li>
      <Link href={href} className="block py-2 hover:text-brand">
        <div className="truncate text-sm">{title}</div>
        <div className="truncate text-xs text-muted">{sub}</div>
      </Link>
    </li>
  );
}
