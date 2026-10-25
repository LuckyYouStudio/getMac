import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CYCLES, ORDER_STATUS, type Cycle } from "@/lib/constants";
import { dateTime, usd } from "@/lib/format";
import { Empty, PageHeader, Pager, StatusBadge } from "@/components/ui";
import { OrderBuyer } from "@/components/admin/Bits";

export const metadata = { title: "订单管理" };
const PER = 20;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string; who?: string }> }) {
  const { status = "", q = "", page: p = "1", who = "" } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(who === "guest" ? { userId: null } : who === "user" ? { userId: { not: null } } : {}),
    ...(q ? { OR: [{ no: { contains: q } }, { deliveryEmail: { contains: q } }, { contactName: { contains: q } }, { user: { email: { contains: q } } }] } : {}),
  };
  const [orders, total, counts] = await Promise.all([
    db.order.findMany({ where, include: { user: true, plan: true, machine: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const qs = (o: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(who && { who }), ...o });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    return `/admin/orders?${sp}`;
  };

  return (
    <div>
      <PageHeader title="自营订单" desc={`共 ${total} 条`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={qs({ status: "", page: "" })} className={!status ? "btn-primary btn-sm" : "btn-outline btn-sm"}>全部</Link>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <Link key={k} href={qs({ status: k, page: "" })} className={status === k ? "btn-primary btn-sm" : "btn-outline btn-sm"}>
            {v.label} {countOf(k)}
          </Link>
        ))}
        <select form="order-search" name="who" defaultValue={who} className="input w-auto py-1.5 text-sm">
          <option value="">全部下单人</option>
          <option value="user">注册用户</option>
          <option value="guest">游客</option>
        </select>
        <form id="order-search" className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="订单号 / 邮箱 / 联系人" className="input w-56 py-1.5" />
          <button className="btn-outline btn-sm">搜索</button>
        </form>
      </div>
      {orders.length === 0 ? (
        <Empty>没有符合条件的订单</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>订单号</th><th>下单人</th><th>方案 / 周期</th><th>金额</th><th>设备</th><th>状态</th><th>下单时间</th><th>到期</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link className="font-mono text-brand hover:underline" href={`/admin/orders/${o.id}`}>{o.no}</Link></td>
                  <td><OrderBuyer user={o.user} contactName={o.contactName} email={o.deliveryEmail} /></td>
                  <td>{o.plan.name} · {CYCLES[o.cycle as Cycle]?.label ?? o.cycle}{o.renewedFromId && <div className="text-xs text-muted">续费单</div>}</td>
                  <td>{usd(o.amount)}</td>
                  <td>{o.machine?.name ?? <span className="text-muted">{o.preferredName ? `想要 ${o.preferredName}` : "未分配"}</span>}</td>
                  <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                  <td className="text-muted">{dateTime(o.createdAt)}</td>
                  <td className="text-muted">{dateTime(o.endAt)}{o.status === "DELIVERED" && <div className="text-xs">{o.autoRenew ? "自动续费" : "到期即停"}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} totalPages={Math.ceil(total / PER)} href={(n) => qs({ page: String(n) })} />
    </div>
  );
}
