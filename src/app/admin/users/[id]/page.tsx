import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DEAL_STATUS, LISTING_STATUS, MACHINE_STATUS, ORDER_STATUS, PAYOUT_STATUS, REPORT_CATEGORIES, REPORT_STATUS, REPORT_TARGETS, WANTED_STATUS,
} from "@/lib/constants";
import { dateTime, money, usd } from "@/lib/format";
import { Badge, PageHeader, StatusBadge } from "@/components/ui";
import { UserActions } from "@/components/admin/UserActions";
import { Heartbeat, Info } from "@/components/admin/Bits";

export const metadata = { title: "用户详情" };

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      orders: { include: { plan: true, machine: true }, orderBy: { createdAt: "desc" } },
      listings: { orderBy: { createdAt: "desc" } },
      wanted: { orderBy: { createdAt: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
      ownedMachines: { orderBy: { name: "asc" } },
      payouts: { orderBy: { month: "desc" } },
      reviewsWritten: { include: { target: true }, orderBy: { createdAt: "desc" } },
      reviewsReceived: { include: { author: true }, orderBy: { createdAt: "desc" } },
      blocking: { include: { blocked: true } },
      blockedBy: { include: { blocker: true } },
    },
  });
  if (!user) notFound();

  // 本人参与的成交（作为房东或租客）
  const deals = await db.deal.findMany({
    where: { inquiry: { OR: [{ hostId: id }, { renterId: id }] } },
    include: { inquiry: { include: { listing: true, wanted: true, host: true, renter: true } } },
    orderBy: { createdAt: "desc" },
  });

  // 针对本人及其内容的举报
  const [posts, replies, messages] = await Promise.all([
    db.communityPost.findMany({ where: { userId: id }, select: { id: true } }),
    db.communityReply.findMany({ where: { userId: id }, select: { id: true } }),
    db.message.findMany({ where: { senderId: id }, select: { id: true } }),
  ]);
  const owned = (type: string, ids: string[]) => ({ targetType: type, targetId: { in: ids } });
  const reportsAgainst = await db.report.findMany({
    where: {
      OR: [
        { targetType: "USER", targetId: id },
        owned("LISTING", user.listings.map((l) => l.id)),
        owned("WANTED", user.wanted.map((w) => w.id)),
        owned("POST", posts.map((p) => p.id)),
        owned("REPLY", replies.map((r) => r.id)),
        owned("MESSAGE", messages.map((m) => m.id)),
        owned("REVIEW", user.reviewsWritten.map((r) => r.id)),
      ],
    },
    include: { reporter: true },
    orderBy: { createdAt: "desc" },
  });
  const paidTotal = user.orders.filter((o) => ["PAID", "PROVISIONING", "DELIVERED", "EXPIRED"].includes(o.status)).reduce((s, o) => s + o.amount, 0);
  const ratings = user.reviewsReceived.filter((r) => !r.hidden && r.publishedAt);
  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : null;

  return (
    <div className="max-w-5xl space-y-4">
      <Link href="/admin/users" className="text-sm text-brand hover:underline">← 用户列表</Link>
      <PageHeader
        title={user.name}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            {user.email}
            {user.role === "ADMIN" && <Badge tone="info">管理员</Badge>}
            {user.officialHost && <Badge tone="ok">官方房东</Badge>}
            {user.restricted && <Badge tone="warn">受限</Badge>}
            {user.banned && <Badge tone="danger">暂停</Badge>}
          </span>
        }
        actions={<UserActions user={user} selfId={admin.id} />}
      />

      <div className="card grid gap-3 p-5 text-sm sm:grid-cols-4">
        <Info k="微信" v={user.wechat || "—"} />
        <Info k="注册时间" v={dateTime(user.createdAt)} />
        <Info k="自营累计消费" v={usd(paidTotal)} />
        <Info k="收到的评价" v={avg ? `${avg} 分 · ${ratings.length} 条` : "暂无"} />
        {user.bio && <div className="sm:col-span-4"><Info k="公开简介" v={user.bio} /></div>}
        {user.officialHost && (
          <>
            <Info k="签署房东协议" v={dateTime(user.hostAgreedAt)} />
            <div className="sm:col-span-3"><Info k="收款信息" v={user.payoutInfo || <span className="text-warn">未填写</span>} /></div>
          </>
        )}
        {user.listings.length > 0 && <div className="sm:col-span-4"><Link href={`/market/hosts/${user.id}`} target="_blank" className="text-brand hover:underline">查看公开主页 →</Link></div>}
      </div>

      {user.officialHost && (
        <Section title={`托管机器（${user.ownedMachines.length}）`}>
          {user.ownedMachines.map((m) => (
            <tr key={m.id}>
              <td><Link href={`/admin/machines/${m.id}`} className="font-medium text-brand hover:underline">{m.name}</Link></td>
              <td>{m.chip} · {m.memory}G / {m.storage}G</td>
              <td>{m.location}</td>
              <td><Heartbeat at={m.heartbeatAt} /></td>
              <td><StatusBadge map={MACHINE_STATUS} value={m.status} /></td>
            </tr>
          ))}
        </Section>
      )}

      {user.payouts.length > 0 && (
        <Section title={`结算（${user.payouts.length}）`}>
          {user.payouts.map((p) => (
            <tr key={p.id}>
              <td className="font-mono">{p.month}</td>
              <td>实付 {usd(p.gross)}</td>
              <td className="text-muted">服务费 −{usd(p.fee)}</td>
              <td className="font-semibold">{usd(p.net)}</td>
              <td><StatusBadge map={PAYOUT_STATUS} value={p.status} /></td>
            </tr>
          ))}
        </Section>
      )}

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

      <Section title={`求租帖（${user.wanted.length}）`}>
        {user.wanted.map((w) => (
          <tr key={w.id}>
            <td colSpan={3}><Link href={`/market/wanted/${w.id}`} target="_blank" className="text-brand hover:underline">{w.title}</Link></td>
            <td><StatusBadge map={WANTED_STATUS} value={w.status} /></td>
            <td className="text-muted">{dateTime(w.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section title={`成交（${deals.length}）`}>
        {deals.map((d) => (
          <tr key={d.id}>
            <td colSpan={2}>
              <Link href={`/admin/inquiries/${d.inquiryId}`} className="text-brand hover:underline">
                {d.inquiry.listing?.title ?? d.inquiry.wanted?.title ?? "对话"}
              </Link>
            </td>
            <td>{d.inquiry.hostId === id ? `作为房东 · 租客 ${d.inquiry.renter.name}` : `作为租客 · 房东 ${d.inquiry.host.name}`}</td>
            <td><StatusBadge map={DEAL_STATUS} value={d.status} />{d.hidden && <span className="ml-1 text-xs text-danger">不计入</span>}</td>
            <td className="text-muted">{dateTime(d.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section title={`评价（收到 ${user.reviewsReceived.length} · 写出 ${user.reviewsWritten.length}）`}>
        {[
          ...user.reviewsReceived.map((r) => (
            <tr key={r.id} className={r.hidden ? "opacity-50" : ""}>
              <td>收到</td>
              <td>{r.author.name}</td>
              <td className="text-warn">{"★".repeat(r.rating)}</td>
              <td colSpan={2}>{r.body}</td>
              <td className="text-muted">{r.publishedAt ? dateTime(r.publishedAt) : "未公开"}</td>
            </tr>
          )),
          ...user.reviewsWritten.map((r) => (
            <tr key={r.id} className={r.hidden ? "opacity-50" : ""}>
              <td>写给</td>
              <td>{r.target.name}</td>
              <td className="text-warn">{"★".repeat(r.rating)}</td>
              <td colSpan={2}>{r.body}</td>
              <td className="text-muted">{r.publishedAt ? dateTime(r.publishedAt) : "未公开"}</td>
            </tr>
          )),
        ]}
      </Section>

      <Section title={`屏蔽关系（屏蔽了 ${user.blocking.length} · 被屏蔽 ${user.blockedBy.length}）`}>
        {[
          ...user.blocking.map((b) => (
            <tr key={b.id}>
              <td>屏蔽了</td>
              <td colSpan={3}><Link href={`/admin/users/${b.blocked.id}`} className="text-brand hover:underline">{b.blocked.name}</Link></td>
              <td className="text-muted">{dateTime(b.createdAt)}</td>
            </tr>
          )),
          ...user.blockedBy.map((b) => (
            <tr key={b.id}>
              <td>被屏蔽</td>
              <td colSpan={3}><Link href={`/admin/users/${b.blocker.id}`} className="text-brand hover:underline">{b.blocker.name}</Link></td>
              <td className="text-muted">{dateTime(b.createdAt)}</td>
            </tr>
          )),
        ]}
      </Section>

      <Section title={`被举报记录（${reportsAgainst.length}）`}>
        {reportsAgainst.map((r) => (
          <tr key={r.id}>
            <td><Badge tone="danger">{REPORT_CATEGORIES[r.category] ?? r.category}</Badge></td>
            <td>{REPORT_TARGETS[r.targetType] ?? r.targetType}</td>
            <td colSpan={2}>{r.reason}</td>
            <td><StatusBadge map={REPORT_STATUS} value={r.status} /></td>
            <td className="text-muted">{r.reporter.name} · {dateTime(r.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section title={`提交的举报（${user.reports.length}）`}>
        {user.reports.map((r) => (
          <tr key={r.id}>
            <td><Badge>{REPORT_CATEGORIES[r.category] ?? r.category}</Badge></td>
            <td>{REPORT_TARGETS[r.targetType] ?? r.targetType}</td>
            <td colSpan={2}>{r.reason}</td>
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
