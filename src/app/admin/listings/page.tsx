import Link from "next/link";
import { db } from "@/lib/db";
import { ADMIN_ACCESS, HOST_STATUS, LISTING_STATUS, NETWORK } from "@/lib/constants";
import { ago, dateTime, money } from "@/lib/format";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { reviewListing } from "../actions/market";

export const metadata = { title: "方案审核" };

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "PENDING", q = "" } = await searchParams;
  const [listings, counts] = await Promise.all([
    db.listing.findMany({
      where: { status, ...(q ? { OR: [{ title: { contains: q } }, { host: { name: { contains: q } } }] } : {}) },
      include: { host: { include: { _count: { select: { listings: true } } } }, _count: { select: { inquiries: true } } },
      orderBy: status === "PENDING" ? { createdAt: "asc" } : { updatedAt: "desc" },
      take: 100,
    }),
    db.listing.groupBy({ by: ["status"], _count: true }),
  ]);
  const reportCounts = await db.report.groupBy({
    by: ["targetId"],
    where: { targetType: "LISTING", targetId: { in: listings.map((l) => l.id) } },
    _count: true,
  });

  return (
    <div>
      <PageHeader title="出租方案审核" desc="第三方房东发布的方案需审核通过后才会在租赁市场展示。" />
      <Tabs
        current={status}
        tabs={Object.entries(LISTING_STATUS).map(([k, v]) => ({
          key: k, label: v.label, href: `/admin/listings?status=${k}`, count: counts.find((c) => c.status === k)?._count ?? 0,
        }))}
      />
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} placeholder="标题 / 房东" className="input w-60 py-1.5" />
        <button className="btn-outline btn-sm">搜索</button>
      </form>

      {listings.length === 0 ? (
        <Empty>该状态下没有方案</Empty>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const reports = reportCounts.find((r) => r.targetId === l.id)?._count ?? 0;
            return (
              <div key={l.id} id={l.id} className="card grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{l.title}</h3>
                    <StatusBadge map={LISTING_STATUS} value={l.status} />
                    {reports > 0 && <span className="text-xs text-danger">被举报 {reports} 次</span>}
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {[l.country, l.region, l.city].filter(Boolean).join(" ")} · {l.deviceModel} · {l.memory}GB / {l.storage}GB · {ADMIN_ACCESS[l.adminAccess]} · {NETWORK[l.network]}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>{money(l.price, l.currency)} / 月</b>
                    <span className="text-muted"> · 最短 {l.minMonths} 月 · 首期 {money(l.firstPayment, l.currency)} · 押金 {l.deposit ? money(l.deposit, l.currency) : "无"} · 额外费用 {l.extraFees || "无"}</span>
                  </p>
                  <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm whitespace-pre-line text-ink-soft">{l.description}</p>
                  {l.rejectReason && <p className="mt-2 text-sm text-danger">驳回理由：{l.rejectReason}</p>}
                  <p className="mt-2 text-xs text-muted">
                    提交 {dateTime(l.createdAt)} · 房东确认 {ago(l.confirmedAt)} · 浏览 {l.views} · 咨询 {l._count.inquiries}
                    {l.status === "PUBLISHED" && <> · <Link href={`/market/${l.id}`} target="_blank" className="text-brand hover:underline">前台查看</Link></>}
                  </p>
                </div>

                <div className="space-y-3 border-line lg:border-l lg:pl-4">
                  <div className="text-sm">
                    <Link href={`/admin/users/${l.host.id}`} className="font-medium text-brand hover:underline">{l.host.name}</Link>{" "}
                    <StatusBadge map={HOST_STATUS} value={l.host.hostStatus} />
                    <div className="text-xs text-muted">{l.host.email} · 共 {l.host._count.listings} 个方案</div>
                    {l.host.banned && <div className="text-xs text-danger">该用户已封禁</div>}
                  </div>
                  {l.status !== "PUBLISHED" && (
                    <form action={reviewListing}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value={l.status === "OFFLINE" ? "restore" : "approve"} />
                      <SubmitButton className="btn-safe w-full">{l.status === "OFFLINE" ? "重新上架" : "审核通过"}</SubmitButton>
                    </form>
                  )}
                  {l.status === "PUBLISHED" && (
                    <form action={reviewListing}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="offline" />
                      <SubmitButton className="btn-outline w-full" confirm="确定下架该方案？">下架</SubmitButton>
                    </form>
                  )}
                  {l.status !== "REJECTED" && (
                    <form action={reviewListing} className="space-y-2">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <textarea name="reason" rows={2} className="input text-xs" placeholder="驳回理由（房东可见）" />
                      <SubmitButton className="btn-danger w-full">驳回</SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
