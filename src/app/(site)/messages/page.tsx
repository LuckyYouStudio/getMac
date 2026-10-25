import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ago } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "站内消息" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const inquiries = await db.inquiry.findMany({
    where: { OR: [{ renterId: user.id }, { hostId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { title: true } },
      renter: { select: { name: true } },
      host: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { read: false, senderId: { not: user.id } } } } },
    },
  });

  return (
    <div className="container-page max-w-3xl py-10">
      <PageHeader title="站内消息" desc="和房东或租客的咨询记录都在这里。请尽量在站内确认关键条件。" />
      {inquiries.length === 0 ? (
        <Empty>
          还没有消息。去<Link href="/market" className="text-brand hover:underline">租赁市场</Link>看看合适的设备吧。
        </Empty>
      ) : (
        <div className="card divide-y divide-line">
          {inquiries.map((q) => {
            const asHost = q.hostId === user.id;
            const other = asHost ? q.renter.name : q.host.name;
            const last = q.messages[0];
            const unread = q._count.messages;
            return (
              <Link key={q.id} href={`/messages/${q.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand">
                  {other.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${unread ? "text-ink" : "text-ink-soft"}`}>{other}</span>
                    <Badge tone={asHost ? "ok" : "info"}>{asHost ? "我是房东" : "我是租客"}</Badge>
                    {last && <span className="ml-auto shrink-0 text-xs text-muted">{ago(last.createdAt)}</span>}
                  </div>
                  <p className="truncate text-xs text-muted">{q.listing.title}</p>
                  <p className={`mt-0.5 truncate text-sm ${unread ? "font-medium text-ink" : "text-muted"}`}>
                    {last ? `${last.senderId === user.id ? "我：" : ""}${last.body}` : "（暂无消息）"}
                  </p>
                </div>
                {unread > 0 && <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-xs text-white">{unread}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
