import Link from "next/link";
import { db } from "@/lib/db";
import { MARKET_LIMITS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Empty, Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "对话记录" };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; host?: string }> }) {
  const { q = "", host = "" } = await searchParams;
  const cutoff = new Date(Date.now() - MARKET_LIMITS.unansweredHours * 3600000);
  const [inquiries, unanswered] = await Promise.all([
    db.inquiry.findMany({
      where: {
        ...(host ? { hostId: host } : {}),
        ...(q
          ? {
              OR: [
                { listing: { title: { contains: q } } },
                { wanted: { title: { contains: q } } },
                { renter: { email: { contains: q } } },
                { host: { email: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { listing: true, wanted: true, renter: true, host: true, _count: { select: { messages: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    // 超过 48 小时未首次回复的租客咨询（不含房东主动回应求租的对话）
    db.inquiry.groupBy({
      by: ["hostId"],
      where: { listingId: { not: null }, hostRepliedAt: null, createdAt: { lt: cutoff } },
      _count: true,
    }),
  ]);
  const flagged = unanswered.filter((u) => u._count >= 3);
  const flaggedHosts = flagged.length
    ? await db.user.findMany({ where: { id: { in: flagged.map((f) => f.hostId) } } })
    : [];

  return (
    <div>
      <PageHeader title="对话记录" desc="租客咨询方案、房东回应求租的站内对话，只读。仅在处理纠纷或举报时查阅。" />
      {flaggedHosts.length > 0 && (
        <div className="mb-4">
          <Notice tone="warn">
            以下房东有 3 条以上咨询超过 {MARKET_LIMITS.unansweredHours} 小时未回复：
            {flaggedHosts.map((h) => (
              <Link key={h.id} href={`/admin/inquiries?host=${h.id}`} className="ml-2 underline">
                {h.name}（{flagged.find((f) => f.hostId === h.id)?._count}）
              </Link>
            ))}
          </Notice>
        </div>
      )}
      <form className="mb-4 flex gap-2">
        {host && <input type="hidden" name="host" value={host} />}
        <input name="q" defaultValue={q} placeholder="方案 / 求租标题 / 邮箱" className="input w-64 py-1.5" />
        <button className="btn-outline btn-sm">搜索</button>
        {host && <Link href="/admin/inquiries" className="btn-ghost btn-sm">清除房东筛选</Link>}
      </form>
      {inquiries.length === 0 ? (
        <Empty>暂无对话</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>关于</th><th>租客</th><th>房东</th><th>消息</th><th>房东回复</th><th>最近更新</th><th /></tr></thead>
            <tbody>
              {inquiries.map((i) => {
                const late = i.listingId && !i.hostRepliedAt && i.createdAt < cutoff;
                return (
                  <tr key={i.id}>
                    <td className="max-w-xs">
                      {i.listing ? (
                        <span className="block truncate">{i.listing.title}</span>
                      ) : i.wanted ? (
                        <span className="block truncate"><Badge>回应求租</Badge> {i.wanted.title}</span>
                      ) : (
                        <span className="text-muted">已删除</span>
                      )}
                      {i.purpose && <div className="truncate text-xs text-muted">用途：{i.purpose}{i.term && ` · ${i.term}`}</div>}
                    </td>
                    <td>{i.renter.name}<div className="text-xs text-muted">{i.renter.email}</div></td>
                    <td>{i.host.name}<div className="text-xs text-muted">{i.host.email}</div></td>
                    <td>{i._count.messages}</td>
                    <td className="text-xs">
                      {!i.listingId ? <span className="text-muted">—</span> : i.hostRepliedAt ? dateTime(i.hostRepliedAt) : late ? <span className="text-danger">超时未回复</span> : <span className="text-warn">待回复</span>}
                    </td>
                    <td className="text-muted">{dateTime(i.updatedAt)}</td>
                    <td className="text-right"><Link href={`/admin/inquiries/${i.id}`} className="btn-ghost btn-sm">查看</Link></td>
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
