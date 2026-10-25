import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listViewerOrders } from "@/lib/order-access";
import { CYCLES, ORDER_STATUS, type Cycle } from "@/lib/constants";
import { date, usd } from "@/lib/format";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";

export const metadata = { title: "我的订单" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [user, orders] = await Promise.all([getCurrentUser(), listViewerOrders()]);
  const now = new Date();

  return (
    <div className="container-page py-12">
      <PageHeader
        title="我的订单"
        desc={user ? "你账号下的自营订单，以及在这个浏览器上下的订单。" : "在这个浏览器上下的自营订单。换了设备？打开邮件里的订单专属链接即可。"}
        actions={<Link href="/pricing#plans" className="btn-primary">新开一台</Link>}
      />
      {orders.length === 0 ? (
        <Empty>
          这个浏览器上还没有订单。{" "}
          {!user && <><Link href="/login?next=/orders" className="text-brand hover:underline">登录</Link>查看账号下的订单，或 </>}
          <Link href="/pricing" className="text-brand hover:underline">去看看方案 →</Link>
        </Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table min-w-[640px]">
            <thead><tr><th>订单号</th><th>方案</th><th>机器</th><th>金额</th><th>状态</th><th>到期</th><th /></tr></thead>
            <tbody>
              {orders.map((o) => {
                const lapsed = o.status === "PENDING" && o.reserveUntil < now;
                return (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.no}</td>
                    <td>{o.plan.name} · {CYCLES[o.cycle as Cycle]?.label}</td>
                    <td>{o.machine?.name ?? "—"}</td>
                    <td>{usd(o.amount)}</td>
                    <td>{lapsed ? <Badge>保留已过期</Badge> : <StatusBadge map={ORDER_STATUS} value={o.status} />}</td>
                    <td className="text-muted">{date(o.endAt)}</td>
                    <td className="text-right"><Link href={`/orders/${o.id}`} className="btn-outline btn-sm">查看</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!user && orders.length > 0 && (
        <p className="mt-4 text-xs text-muted">订单记在这个浏览器的 cookie 里。清除浏览器数据后，可以用邮件里的专属链接重新打开。</p>
      )}
    </div>
  );
}
