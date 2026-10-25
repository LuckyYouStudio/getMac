import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LISTING_STATUS } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { Notice, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { location } from "@/components/market/ListingCard";
import { replyAction } from "../actions";

export const metadata = { title: "对话" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const inquiry = await db.inquiry.findUnique({
    where: { id },
    include: {
      listing: true,
      renter: { select: { id: true, name: true } },
      host: { select: { id: true, name: true, hostStatus: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!inquiry || (inquiry.renterId !== user.id && inquiry.hostId !== user.id)) notFound();

  await db.message.updateMany({
    where: { inquiryId: id, senderId: { not: user.id }, read: false },
    data: { read: true },
  });

  const asHost = inquiry.hostId === user.id;
  const other = asHost ? inquiry.renter : inquiry.host;
  const l = inquiry.listing;

  return (
    <div className="container-page grid max-w-5xl gap-6 py-10 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Link href="/messages" className="text-sm text-muted hover:text-brand">← 全部消息</Link>
        <div className="card flex flex-col">
          <div className="border-b border-line px-5 py-4">
            <div className="font-semibold">与 {other.name} 的对话</div>
            <div className="text-xs text-muted">{asHost ? "对方是租客" : "对方是房东"}</div>
          </div>
          <div className="space-y-4 px-5 py-5">
            {inquiry.messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-surface-2 text-ink"
                      }`}
                    >
                      {m.body}
                    </div>
                    <div className={`mt-1 text-[11px] text-muted ${mine ? "text-right" : ""}`}>{dateTime(m.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            <div id="bottom" />
          </div>
          <form action={replyAction} className="border-t border-line p-4">
            <input type="hidden" name="inquiryId" value={inquiry.id} />
            <textarea name="body" required maxLength={2000} rows={3} className="input" placeholder="输入消息…" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">不要在聊天中发送密码、银行卡等敏感信息。</span>
              <SubmitButton pendingText="发送中…">发送</SubmitButton>
            </div>
          </form>
        </div>
      </div>

      <aside className="space-y-4 lg:pt-9">
        <div className="card p-5">
          <div className="text-xs text-muted">咨询的方案</div>
          <Link href={`/market/${l.id}`} className="mt-1 block font-semibold hover:text-brand">{l.title}</Link>
          <p className="mt-1 text-sm text-muted">{location(l)} · {l.deviceModel}</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-navy">{money(l.price, l.currency)}</span>
            <span className="text-muted"> / 月 · 最短 {l.minMonths} 月</span>
          </p>
          <div className="mt-2"><StatusBadge map={LISTING_STATUS} value={l.status} /></div>
        </div>
        <Notice tone="warn">
          租金、交付和售后由你们双方约定，GetMac 不经手。首次合作建议按月付，不要大额预付；遇到可疑情况请在方案页举报。
        </Notice>
      </aside>
    </div>
  );
}
