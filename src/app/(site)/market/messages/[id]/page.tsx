import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays } from "@/lib/dates";
import { parseJson } from "@/lib/json";
import { DEAL_STATUS, LISTING_STATUS, MARKET_LIMITS } from "@/lib/constants";
import { date, dateTime, money } from "@/lib/format";
import { Notice, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash } from "@/components/market/Flash";
import { ReportForm } from "@/components/market/ReportForm";
import { blockAction, dealAction, deliveryAction, replyAction, reviewAction } from "../../_actions/conversations";
import { publishDueReviews } from "../../_server/reviews";

export const metadata = { title: "对话 · 租赁市场" };

type Snapshot = { title: string; price: number; currency: string; minMonths: number; firstPayment: number; deposit: number; extraFees?: string | null; at?: string };

function Hidden({ inquiryId, extra }: { inquiryId: string; extra?: Record<string, string> }) {
  return (
    <>
      <input type="hidden" name="inquiryId" value={inquiryId} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    </>
  );
}

export default async function ThreadPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const back = `/market/messages/${id}`;
  const user = await requireUser(back);
  await publishDueReviews();
  const t = await db.inquiry.findUnique({
    where: { id },
    include: {
      listing: true,
      wanted: { select: { id: true, title: true } },
      renter: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
      deals: { orderBy: { createdAt: "desc" }, include: { reviews: true } },
    },
  });
  if (!t || (t.renterId !== user.id && t.hostId !== user.id)) notFound();

  await db.message.updateMany({ where: { inquiryId: id, senderId: { not: user.id }, read: false }, data: { read: true } });

  const isHost = t.hostId === user.id;
  const other = isHost ? t.renter : t.host;
  const [iBlocked, theyBlocked] = await Promise.all([
    db.block.count({ where: { blockerId: user.id, blockedId: other.id } }),
    db.block.count({ where: { blockerId: other.id, blockedId: user.id } }),
  ]);
  const blocked = iBlocked > 0 || theyBlocked > 0;
  const snap = parseJson<Snapshot | null>(t.listingSnapshot, null);
  const deal = t.deals.find((d) => d.status === "PROPOSED" || d.status === "CONFIRMED") ?? null;
  const myReview = deal?.reviews.find((r) => r.authorId === user.id);
  const theirReview = deal?.reviews.find((r) => r.authorId !== user.id && r.publishedAt);
  const reviewOpen = deal?.confirmedAt && deal.confirmedAt > addDays(new Date(), -MARKET_LIMITS.reviewWindowDays);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href="/market/messages" className="text-sm text-muted hover:text-brand">← 全部消息</Link>
      <Flash ok={sp.ok} err={sp.err} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-semibold">与 {other.name} 的对话</div>
              <div className="text-xs text-muted">
                {t.listing ? <>关于方案 <Link href={`/market/${t.listing.id}`} className="text-brand hover:underline">{t.listing.title}</Link></> : null}
                {t.wanted ? <> · 求租 <Link href={`/market/wanted/${t.wanted.id}`} className="text-brand hover:underline">{t.wanted.title}</Link></> : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isHost || <Link href={`/market/hosts/${other.id}`} className="text-xs text-brand hover:underline">房东主页</Link>}
              <form action={blockAction}>
                <input type="hidden" name="userId" value={other.id} />
                <input type="hidden" name="op" value={iBlocked ? "unblock" : "block"} />
                <input type="hidden" name="returnTo" value={back} />
                <SubmitButton className="btn-ghost btn-sm" pendingText="…" confirm={iBlocked ? undefined : "屏蔽后双方都不能再发消息或发起咨询，确定？"}>
                  {iBlocked ? "取消屏蔽" : "屏蔽对方"}
                </SubmitButton>
              </form>
            </div>
          </div>

          <div className="card space-y-4 p-5">
            {t.messages.map((m) => {
              const mine = m.senderId === user.id;
              const system = m.body.startsWith("【系统】");
              if (system) return <p key={m.id} className="text-center text-xs text-muted">{m.body.replace("【系统】", "")} · {dateTime(m.createdAt)}</p>;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${mine ? "bg-brand text-white" : "bg-surface-2 text-ink"}`}>{m.body}</div>
                    <div className={`mt-1 flex gap-3 text-[11px] text-muted ${mine ? "justify-end" : ""}`}>
                      <span>{dateTime(m.createdAt)}</span>
                      {!mine && <ReportForm targetType="MESSAGE" targetId={m.id} returnTo={back} loggedIn label="举报" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {blocked ? (
            <Notice tone="warn">{iBlocked ? "你已屏蔽对方。" : "对方已屏蔽你。"}这段对话不能再发送消息。</Notice>
          ) : (
            <form action={replyAction} className="card space-y-3 p-4">
              <Hidden inquiryId={id} />
              <textarea name="body" required maxLength={2000} rows={3} className="input" placeholder="输入消息…" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">不要转到站外私下交易，不要发送账号密码。</span>
                <SubmitButton pendingText="发送中…">发送</SubmitButton>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {snap && (
            <div className="card p-4 text-sm">
              <div className="font-semibold">你咨询时的报价</div>
              <p className="mt-1 text-xs text-muted">{snap.at ? `${date(snap.at)} 记录` : ""}</p>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between"><dt className="text-muted">月租</dt><dd>{money(snap.price, snap.currency)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">最短租期</dt><dd>{snap.minMonths} 个月</dd></div>
                <div className="flex justify-between"><dt className="text-muted">首期 / 押金</dt><dd>{money(snap.firstPayment, snap.currency)} / {money(snap.deposit, snap.currency)}</dd></div>
              </dl>
              {t.listing && (t.listing.price !== snap.price || t.listing.currency !== snap.currency) && (
                <p className="mt-2 text-xs text-warn">房东之后改过报价，现在是 {money(t.listing.price, t.listing.currency)} / 月。</p>
              )}
              {t.listing && t.listing.status !== "PUBLISHED" && (
                <p className="mt-2 text-xs text-muted">方案当前：<StatusBadge map={LISTING_STATUS} value={t.listing.status} /></p>
              )}
            </div>
          )}
          {(t.purpose || t.term) && (
            <div className="card p-4 text-sm">
              <div className="font-semibold">租客的需求</div>
              <dl className="mt-2 space-y-1">
                {t.purpose && <div className="flex justify-between gap-2"><dt className="text-muted">用途</dt><dd className="text-right">{t.purpose}</dd></div>}
                <div className="flex justify-between gap-2"><dt className="text-muted">开始</dt><dd>{t.startMode === "DATE" ? date(t.startDate) : t.startMode === "ASAP" ? "尽快" : "待定"}</dd></div>
                {t.term && <div className="flex justify-between gap-2"><dt className="text-muted">租期</dt><dd>{t.term}</dd></div>}
              </dl>
            </div>
          )}

          <div className="card space-y-3 p-4 text-sm">
            <div className="font-semibold">确认成交</div>
            <p className="text-xs leading-5 text-muted">谈妥之后由一方发起、另一方确认。双方确认的成交会计入房东主页的记录，之后可以互相评价。</p>
            {!deal && !blocked && (
              <form action={dealAction}><Hidden inquiryId={id} extra={{ op: "propose" }} /><SubmitButton className="btn-outline btn-sm w-full">发起确认成交</SubmitButton></form>
            )}
            {deal && <div><StatusBadge map={DEAL_STATUS} value={deal.status} /></div>}
            {deal?.status === "PROPOSED" && deal.proposerId === user.id && (
              <form action={dealAction}><Hidden inquiryId={id} extra={{ op: "cancel" }} /><SubmitButton className="btn-ghost btn-sm">撤回</SubmitButton></form>
            )}
            {deal?.status === "PROPOSED" && deal.proposerId !== user.id && (
              <div className="flex gap-2">
                <form action={dealAction}><Hidden inquiryId={id} extra={{ op: "confirm" }} /><SubmitButton className="btn-safe btn-sm">确认成交</SubmitButton></form>
                <form action={dealAction}><Hidden inquiryId={id} extra={{ op: "decline" }} /><SubmitButton className="btn-ghost btn-sm">暂不确认</SubmitButton></form>
              </div>
            )}
            {deal?.status === "CONFIRMED" && (
              <div className="space-y-3 border-t border-line pt-3">
                <div className="text-xs text-muted">{date(deal.confirmedAt)} 双方确认</div>
                <div>
                  <div className="font-medium">交付记录</div>
                  <p className="mt-1 text-xs text-ink-soft">
                    房东：{deal.hostDelivered ? "已交付" : "未标记"} · 租客：{deal.renterConnected === "YES" ? "已能连上" : deal.renterConnected === "NO" ? "还连不上" : "未标记"}
                  </p>
                  {isHost && !deal.hostDelivered && (
                    <form action={deliveryAction} className="mt-2"><Hidden inquiryId={id} /><SubmitButton className="btn-outline btn-sm">标记已交付</SubmitButton></form>
                  )}
                  {!isHost && (
                    <form action={deliveryAction} className="mt-2 flex gap-2">
                      <Hidden inquiryId={id} />
                      <button name="connected" value="YES" className="btn-outline btn-sm">已能连上</button>
                      <button name="connected" value="NO" className="btn-ghost btn-sm">还连不上</button>
                    </form>
                  )}
                </div>
                <div>
                  <div className="font-medium">评价</div>
                  {myReview ? (
                    <p className="mt-1 text-xs text-ink-soft">你已评价 {"★".repeat(myReview.rating)}。{myReview.publishedAt ? "已公开。" : "对方提交后或期限到后同时公开。"}</p>
                  ) : reviewOpen ? (
                    <form action={reviewAction} className="mt-2 space-y-2">
                      <Hidden inquiryId={id} />
                      <select name="rating" required defaultValue="" className="input">
                        <option value="" disabled>打分</option>
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                      </select>
                      <textarea name="body" required minLength={4} maxLength={500} rows={3} className="input" placeholder="说说这次合作" />
                      <SubmitButton className="btn-outline btn-sm">提交评价</SubmitButton>
                      <p className="text-[11px] text-muted">成交后 {MARKET_LIMITS.reviewWindowDays} 天内可评价，双方评价同时公开。</p>
                    </form>
                  ) : (
                    <p className="mt-1 text-xs text-muted">评价期已过。</p>
                  )}
                  {theirReview && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">对方的评价：{"★".repeat(theirReview.rating)} {theirReview.body}</p>}
                </div>
              </div>
            )}
          </div>

          <Notice tone="warn">
            平台不经手租金。第一次合作按月付，不要大额预付；对方要求站外联系或先付大额款项时，请举报。
            <Link href="/market/rules#deals" className="ml-1 underline">交易须知</Link>
          </Notice>
        </aside>
      </div>
    </div>
  );
}
