import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { HOST_STATUS, LISTING_STATUS, ORDER_STATUS, REPORT_STATUS } from "@/lib/constants";
import { dateTime, money, usd } from "@/lib/format";
import { Badge, PageHeader, StatusBadge } from "@/components/ui";
import { UserActions } from "@/components/admin/UserActions";

export const metadata = { title: "用户详情" };

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      orders: { include: { plan: true, machine: true }, orderBy: { createdAt: "desc" } },
      listings: { orderBy: { createdAt: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
      wanted: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();
  const listingIds = user.listings.map((l) => l.id);
  const reportsAgainst = await db.report.findMany({
    where: { OR: [{ targetType: "USER", targetId: id }, { targetType: "LISTING", targetId: { in: listingIds } }] },
    include: { reporter: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl space-y-4">
      <Link href="/admin/users" className="text-sm text-brand hover:underline">← 用户列表</Link>
      <PageHeader
        title={user.name}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            {user.email}
            {user.role === "ADMIN" && <Badge tone="info">管理员</Badge>}
            <StatusBadge map={HOST_STATUS} value={user.hostStatus} />
            {user.banned && <Badge tone="danger">已封禁</Badge>}
          </span>
        }
        actions={<UserActions user={user} selfId={admin.id} />}
      />

      <div className="card grid gap-3 p-5 text-sm sm:grid-cols-3">
        <div><div className="text-xs text-muted">微信</div>{user.wechat || "—"}</div>
        <div><div className="text-xs text-muted">注册时间</div>{dateTime(user.createdAt)}</div>
        <div><div className="text-xs text-muted">累计消费</div>{usd(user.orders.filter((o) => ["PAID", "PROVISIONING", "DELIVERED", "EXPIRED"].includes(o.status)).reduce((s, o) => s + o.amount, 0))}</div>
        {user.hostIntro && <div className="sm:col-span-3"><div className="text-xs text-muted">房东介绍 / 申请说明</div>{user.hostIntro}</div>}
      </div>

      <Section title={`自营订单（${user.orders.length}）`}>
        {user.orders.map((o) => (
          <tr key={o.id}>
            <td><Link href={`/admin/orders/${o.id}`} className="font-mono text-brand hover:underline">{o.no}</Link></td>
            <td>{o.plan.name} · {o.months} 个月</td>
            <td>{usd(o.amount)}</td>
            <td>{o.machine?.name ?? "—"}</td>
            <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
            <td className="text-muted">{dateTime(o.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section title={`发布的出租方案（${user.listings.length}）`}>
        {user.listings.map((l) => (
          <tr key={l.id}>
            <td colSpan={2}><Link href={`/admin/listings?status=${l.status}#${l.id}`} className="text-brand hover:underline">{l.title}</Link></td>
            <td>{money(l.price, l.currency)} / 月</td>
            <td>浏览 {l.views}</td>
            <td><StatusBadge map={LISTING_STATUS} value={l.status} /></td>
            <td className="text-muted">{dateTime(l.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section title={`被举报记录（${reportsAgainst.length}）`}>
        {reportsAgainst.map((r) => (
          <tr key={r.id}>
            <td colSpan={3}>{r.reason}</td>
            <td className="text-muted">{r.reporter.name}</td>
            <td><StatusBadge map={REPORT_STATUS} value={r.status} /></td>
            <td className="text-muted">{dateTime(r.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section title={`提交的举报（${user.reports.length}）`}>
        {user.reports.map((r) => (
          <tr key={r.id}>
            <td colSpan={3}>{r.reason}</td>
            <td className="text-muted">{r.targetType}</td>
            <td><StatusBadge map={REPORT_STATUS} value={r.status} /></td>
            <td className="text-muted">{dateTime(r.createdAt)}</td>
          </tr>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode[] }) {
  return (
    <div className="card overflow-x-auto">
      <h2 className="px-5 pt-4 pb-2 font-semibold">{title}</h2>
      {children.length ? (
        <table className="table"><tbody>{children}</tbody></table>
      ) : (
        <p className="px-5 pb-4 text-sm text-muted">暂无</p>
      )}
    </div>
  );
}
