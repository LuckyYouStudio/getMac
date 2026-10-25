import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ago } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "消息 · 租赁市场" };

export default async function MessagesPage() {
  const user = await requireUser("/market/messages");
  const threads = await db.inquiry.findMany({
    where: { OR: [{ renterId: user.id }, { hostId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { title: true } },
      wanted: { select: { title: true } },
      renter: { select: { name: true } },
      host: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { read: false, senderId: { not: user.id } } } } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="消息" desc="和房东、租客的站内对话。不要在对话里转账或交出账号密码以外的敏感信息。" />
      {threads.length === 0 ? (
        <Empty>
          还没有对话。去<Link href="/market" className="text-brand hover:underline">找设备</Link>，看到合适的方案就可以咨询房东。
        </Empty>
      ) : (
        <div className="card divide-y divide-line">
          {threads.map((t) => {
            const asHost = t.hostId === user.id;
            const other = asHost ? t.renter.name : t.host.name;
            const last = t.messages[0];
            const subject = t.listing?.title ?? t.wanted?.title ?? "对话";
            return (
              <Link key={t.id} href={`/market/messages/${t.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-surface-2/60">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{other}</span>
                    <Badge tone={asHost ? "info" : "muted"}>{asHost ? (t.wantedId ? "我回应的求租" : "我是房东") : (t.wantedId ? "房东回应我的求租" : "我咨询的")}</Badge>
                    {t._count.messages > 0 && <Badge tone="danger">{t._count.messages} 条未读</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{subject}</p>
                  {last && <p className="mt-1 truncate text-sm text-ink-soft">{last.senderId === user.id ? "我：" : ""}{last.body}</p>}
                </div>
                {last && <span className="shrink-0 text-xs text-muted">{ago(last.createdAt)}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
