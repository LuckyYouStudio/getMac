import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "咨询记录" };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const inquiries = await db.inquiry.findMany({
    where: q
      ? { OR: [{ listing: { title: { contains: q } } }, { renter: { email: { contains: q } } }, { host: { email: { contains: q } } }] }
      : {},
    include: { listing: true, renter: true, host: true, _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <PageHeader title="咨询记录" desc="租客与房东的站内咨询，只读。仅在处理纠纷或举报时查阅。" />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="方案标题 / 邮箱" className="input w-60 py-1.5" />
        <button className="btn-outline btn-sm">搜索</button>
      </form>
      {inquiries.length === 0 ? (
        <Empty>暂无咨询</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>方案</th><th>租客</th><th>房东</th><th>消息数</th><th>最近更新</th><th /></tr></thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id}>
                  <td className="max-w-xs truncate">{i.listing.title}</td>
                  <td>{i.renter.name}<div className="text-xs text-muted">{i.renter.email}</div></td>
                  <td>{i.host.name}<div className="text-xs text-muted">{i.host.email}</div></td>
                  <td>{i._count.messages}</td>
                  <td className="text-muted">{dateTime(i.updatedAt)}</td>
                  <td className="text-right"><Link href={`/admin/inquiries/${i.id}`} className="btn-ghost btn-sm">查看</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
