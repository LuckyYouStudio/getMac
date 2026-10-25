import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { HOST_STATUS, LISTING_STATUS } from "@/lib/constants";
import { ago, money } from "@/lib/format";
import { Empty, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { location } from "@/components/market/ListingCard";
import { listingOpAction } from "../actions";

export const metadata = { title: "我的方案" };

function Op({ id, op, label, className = "btn-outline btn-sm", confirm }: { id: string; op: string; label: string; className?: string; confirm?: string }) {
  return (
    <form action={listingOpAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton className={className} pendingText="…" confirm={confirm}>{label}</SubmitButton>
    </form>
  );
}

export default async function MyListingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireUser("/market/mine");
  const listings = await db.listing.findMany({
    where: { hostId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { inquiries: true } } },
  });
  const canPublish = user.hostStatus === "VERIFIED" || user.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title="我的方案"
        desc={<>房东状态 <StatusBadge map={HOST_STATUS} value={user.hostStatus} /></>}
        actions={canPublish ? <Link href="/market/publish" className="btn-primary">发布新方案</Link> : <Link href="/market/become-host" className="btn-primary">申请成为房东</Link>}
      />
      {saved && <div className="mb-4"><Notice tone="ok">已提交审核，通过后会公开展示。</Notice></div>}
      <div className="mb-4">
        <Notice tone="info">建议每周点一次“确认仍可租”，租客会优先看到最近确认过的方案。</Notice>
      </div>
      {listings.length === 0 ? (
        <Empty>还没有发布过方案。</Empty>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/market/${l.id}`} className="truncate font-semibold hover:text-brand">{l.title}</Link>
                  <StatusBadge map={LISTING_STATUS} value={l.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {location(l)} · {l.deviceModel} · {money(l.price, l.currency)}/月 · 浏览 {l.views} · 咨询 {l._count.inquiries} · {ago(l.confirmedAt)}确认
                </p>
                {l.status === "REJECTED" && l.rejectReason && (
                  <p className="mt-1 text-sm text-danger">未通过原因：{l.rejectReason}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {l.status === "PUBLISHED" && <Op id={l.id} op="confirm" label="确认仍可租" className="btn-safe btn-sm" />}
                <Link href={`/market/${l.id}/edit`} className="btn-outline btn-sm">编辑</Link>
                {l.status === "PUBLISHED" && <Op id={l.id} op="offline" label="下架" className="btn-danger btn-sm" confirm="确定下架这个方案？" />}
                {(l.status === "OFFLINE" || l.status === "REJECTED") && <Op id={l.id} op="relist" label="重新提交上架" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
