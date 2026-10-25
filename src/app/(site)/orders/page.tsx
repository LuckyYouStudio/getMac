import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CYCLES, ORDER_STATUS, type Cycle } from "@/lib/constants";
import { date, usd } from "@/lib/format";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";

export const metadata = { title: "我的订单" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { plan: true, machine: true },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();

  return (
    <div className="container-page py-12">
      <PageHeader title="我的订单" desc="自营远程 Mac 的订单。第三方房东的设备请在站内消息里和房东沟通。" actions={<Link href="/pricing#plans" className="btn-primary">新开一台</Link>} />
      {orders.length === 0 ? (
        <Empty>还没有订单。<Link href="/pricing" className="text-brand hover:underline">去看看方案 →</Link></Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>订单号</th><th>方案</th><th>机器</th><th>金额</th><th>状态</th><th>到期</th><th /></tr></thead>
            <tbody>
              {orders.map((o) => {
                const lapsed = o.status === "PENDING" && o.reserveUntil < now;
                return (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.no}</td>
                    <td>{o.plan.name} · {CYCLES[o.cycle as Cycle]?.label}</td>
                    <td>{o.machine?.name ?? o.preferredName ?? "随机分配"}</td>
                    <td>{usd(o.amount)}</td>
                    <td>{lapsed ? <Badge>已过期保留</Badge> : <StatusBadge map={ORDER_STATUS} value={o.status} />}</td>
                    <td className="text-muted">{date(o.endAt)}</td>
                    <td className="text-right"><Link href={`/orders/${o.id}`} className="btn-outline btn-sm">查看</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
