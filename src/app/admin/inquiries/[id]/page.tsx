import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DEAL_STATUS } from "@/lib/constants";
import { date, dateTime, money } from "@/lib/format";
import { parseJson } from "@/lib/json";
import { PageHeader, StatusBadge } from "@/components/ui";
import { Info } from "@/components/admin/Bits";

export const metadata = { title: "对话详情" };

type Snapshot = { title?: string; price?: number; currency?: string; minMonths?: number; firstPayment?: number; deposit?: number; extraFees?: string | null };
const START: Record<string, string> = { ASAP: "尽快", TBD: "待定", DATE: "指定日期" };

export default async function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inq = await db.inquiry.findUnique({
    where: { id },
    include: {
      listing: true, wanted: true, renter: true, host: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      deals: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!inq) notFound();
  const snap = parseJson<Snapshot | null>(inq.listingSnapshot, null);
  const title = inq.listing?.title ?? (inq.wanted ? `回应求租：${inq.wanted.title}` : "对话");

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/inquiries" className="text-sm text-brand hover:underline">← 对话记录</Link>
      <PageHeader
        title={title}
        desc={
          <>
            租客 <Link className="text-brand" href={`/admin/users/${inq.renter.id}`}>{inq.renter.name}</Link> · 房东{" "}
            <Link className="text-brand" href={`/admin/users/${inq.host.id}`}>{inq.host.name}</Link>
            {inq.listing && <> · <Link className="text-brand" href={`/market/${inq.listing.id}`} target="_blank">查看方案</Link></>}
            {inq.wanted && <> · <Link className="text-brand" href={`/market/wanted/${inq.wanted.id}`} target="_blank">查看求租</Link></>}
          </>
        }
      />

      {(inq.purpose || snap) && (
        <div className="card grid gap-3 p-5 text-sm sm:grid-cols-2">
          {inq.purpose && <Info k="用途" v={inq.purpose} />}
          {inq.startMode && <Info k="开始时间" v={inq.startMode === "DATE" ? date(inq.startDate) : START[inq.startMode] ?? inq.startMode} />}
          {inq.term && <Info k="预计租期" v={inq.term} />}
          <Info k="房东首次回复" v={dateTime(inq.hostRepliedAt)} />
          {snap && (
            <div className="sm:col-span-2">
              <Info
                k="咨询时的报价"
                v={
                  snap.price !== undefined
                    ? `${money(snap.price, snap.currency)} / 月 · 最短 ${snap.minMonths ?? 1} 月 · 首期 ${money(snap.firstPayment ?? 0, snap.currency)} · 押金 ${snap.deposit ? money(snap.deposit, snap.currency) : "无"} · 额外费用 ${snap.extraFees || "无"}`
                    : "—"
                }
              />
            </div>
          )}
        </div>
      )}

      {inq.deals.length > 0 && (
        <div className="card p-5 text-sm">
          <h2 className="mb-2 font-semibold">成交记录</h2>
          <ul className="space-y-1">
            {inq.deals.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2">
                <StatusBadge map={DEAL_STATUS} value={d.status} />
                <span className="text-muted">发起 {dateTime(d.createdAt)}{d.confirmedAt && ` · 确认 ${dateTime(d.confirmedAt)}`}</span>
                {d.hidden && <span className="text-xs text-danger">不计入统计</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card space-y-3 p-5">
        {inq.messages.length === 0 && <p className="text-sm text-muted">暂无消息</p>}
        {inq.messages.map((m) => {
          const isHost = m.senderId === inq.hostId;
          return (
            <div key={m.id} id={m.id} className={`flex ${isHost ? "justify-start" : "justify-end"}`}>
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
