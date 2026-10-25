import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "咨询详情" };

export default async function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inq = await db.inquiry.findUnique({
    where: { id },
    include: { listing: true, renter: true, host: true, messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!inq) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/admin/inquiries" className="text-sm text-brand hover:underline">← 咨询记录</Link>
      <PageHeader
        title={inq.listing.title}
        desc={
          <>
            租客 <Link className="text-brand" href={`/admin/users/${inq.renter.id}`}>{inq.renter.name}</Link> · 房东{" "}
            <Link className="text-brand" href={`/admin/users/${inq.host.id}`}>{inq.host.name}</Link> ·{" "}
            <Link className="text-brand" href={`/market/${inq.listing.id}`} target="_blank">查看方案</Link>
          </>
        }
      />
      <div className="card space-y-3 p-5">
        {inq.messages.length === 0 && <p className="text-sm text-muted">暂无消息</p>}
        {inq.messages.map((m) => {
          const isHost = m.senderId === inq.hostId;
          return (
            <div key={m.id} className={`flex ${isHost ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-xl px-3.5 py-2 text-sm ${isHost ? "bg-surface-2" : "bg-brand-soft"}`}>
                <div className="mb-0.5 text-xs text-muted">{m.sender.name}（{isHost ? "房东" : "租客"}）· {dateTime(m.createdAt)}</div>
                <div className="whitespace-pre-line">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
