import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays } from "@/lib/dates";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { AVAILABILITY, LISTING_STATUS, MARKET_LIMITS, WANTED_STATUS } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { Empty, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash } from "@/components/market/Flash";
import { listingOpAction } from "../_actions/listings";

export const metadata = { title: "我的方案" };

function Op({ id, op, label, cls = "btn-outline btn-sm", confirm }: { id: string; op: string; label: string; cls?: string; confirm?: string }) {
  return (
    <form action={listingOpAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton className={cls} pendingText="…" confirm={confirm}>{label}</SubmitButton>
    </form>
  );
}

export default async function MinePage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/market/mine");
  await expireStaleMarket();
  const [listings, wanted] = await Promise.all([
    db.listing.findMany({
      where: { hostId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { inquiries: true } } },
    }),
    db.wantedPost.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { responses: true } } } }),
  ]);
  const now = new Date();
  const confirmFrom = addDays(now, MARKET_LIMITS.listingConfirmWindowDays);
  const reopenSince = addDays(now, -MARKET_LIMITS.listingReopenDays);
  const active = listings.filter((l) => ["PUBLISHED", "PAUSED", "NEEDS_CHANGES"].includes(l.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的方案"
        desc={`有效方案 ${active} / ${MARKET_LIMITS.maxActiveListings}。方案每 ${MARKET_LIMITS.listingTtlDays} 天需确认一次仍可租；回复租客或修改方案也会自动续期。`}
        actions={<Link href="/market/publish" className="btn-primary">发布新方案</Link>}
      />
      <Flash ok={sp.ok} err={sp.err} />

      {listings.length === 0 ? (
        <Empty>还没有发布过方案。<Link href="/market/publish" className="text-brand hover:underline">发布第一个</Link></Empty>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => {
            const live = ["PUBLISHED", "PAUSED"].includes(l.status);
            const canConfirm = (live && l.expiresAt <= confirmFrom) || l.status === "EXPIRED";
            const canReopen = l.status === "CLOSED" && l.closedAt && l.closedAt > reopenSince;
            return (
              <div key={l.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge map={LISTING_STATUS} value={l.status} />
                      <Link href={`/market/${l.id}`} className="font-semibold hover:text-brand">{l.title}</Link>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {money(l.price, l.currency)} / 月 · 浏览 {l.views} · 咨询 {l._count.inquiries}
                      {live && <> · {date(l.expiresAt)} 到期{l.expiresAt <= confirmFrom && <span className="text-warn">（请确认）</span>}</>}
                      {l.status === "CLOSED" && l.closedAt && <> · {date(l.closedAt)} 关闭</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.status !== "REMOVED" && <Link href={`/market/${l.id}/edit`} className="btn-outline btn-sm">{l.status === "DRAFT" ? "继续填写" : "编辑"}</Link>}
                    {canConfirm && <Op id={l.id} op="confirm" label={l.status === "EXPIRED" ? "重新发布" : "确认仍可租"} cls="btn-safe btn-sm" />}
                    {l.status === "PUBLISHED" && <Op id={l.id} op="pause" label="暂停咨询" />}
                    {l.status === "PAUSED" && <Op id={l.id} op="resume" label="恢复咨询" />}
                    {["PUBLISHED", "PAUSED", "NEEDS_CHANGES", "EXPIRED"].includes(l.status) && (
                      <Op id={l.id} op="close" label="关闭" cls="btn-danger btn-sm" confirm={`关闭后不再展示，${MARKET_LIMITS.listingReopenDays} 天内可以重新开放。确定关闭？`} />
                    )}
                    {canReopen && <Op id={l.id} op="reopen" label="重新开放" />}
                    {l.status === "DRAFT" && <Op id={l.id} op="deleteDraft" label="删除草稿" cls="btn-danger btn-sm" confirm="删除后不能恢复，确定？" />}
                  </div>
                </div>
                {l.reviewNote && ["NEEDS_CHANGES", "REMOVED"].includes(l.status) && (
                  <div className="mt-3"><Notice tone="warn">平台说明：{l.reviewNote}</Notice></div>
                )}
                {live && (
                  <form action={listingOpAction} className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="op" value="availability" />
                    <span className="text-muted">档期</span>
                    <select name="availability" defaultValue={l.availability} className="input w-auto py-1">
                      {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input name="availableFrom" type="date" defaultValue={l.availableFrom ? l.availableFrom.toISOString().slice(0, 10) : ""} className="input w-auto py-1" />
                    <SubmitButton className="btn-outline btn-sm" pendingText="…">更新档期</SubmitButton>
                    <span className="text-xs text-muted">选“预计某日起”时填日期</span>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <section>
        <h2 className="mb-3 mt-10 font-semibold">我的求租</h2>
        {wanted.length === 0 ? (
          <Empty>没有求租。<Link href="/market/wanted/new" className="text-brand hover:underline">发一条</Link></Empty>
        ) : (
          <div className="card divide-y divide-line">
            {wanted.map((w) => (
              <Link key={w.id} href={`/market/wanted/${w.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2/60">
                <span className="min-w-0 truncate">{w.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  {w._count.responses} 个回应 <StatusBadge map={WANTED_STATUS} value={w.status} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
