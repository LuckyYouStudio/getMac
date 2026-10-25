import Link from "next/link";
import { db } from "@/lib/db";
import { ADMIN_ACCESS, AVAILABILITY, COUNTRIES, LISTING_STATUS, NETWORK, RESTART } from "@/lib/constants";
import { ago, date, dateTime, money } from "@/lib/format";
import { parseList } from "@/lib/json";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { reviewListing } from "../actions/market";

export const metadata = { title: "出租方案" };

const TAB_ORDER = ["PUBLISHED", "NEEDS_CHANGES", "PAUSED", "EXPIRED", "CLOSED", "REMOVED", "DRAFT"];

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await expireStaleMarket();
  const { status = "PUBLISHED", q = "" } = await searchParams;
  const [listings, counts] = await Promise.all([
    db.listing.findMany({
      where: { status, ...(q ? { OR: [{ title: { contains: q } }, { host: { name: { contains: q } } }, { host: { email: { contains: q } } }] } : {}) },
      include: { host: { include: { _count: { select: { listings: true } } } }, _count: { select: { inquiries: true } } },
      orderBy: status === "PUBLISHED" ? { publishedAt: "desc" } : { updatedAt: "desc" },
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
      <PageHeader
        title="出租方案"
        desc="方案发布后立即展示，平台事后复查：内容有问题就“要求修改”，严重违规直接下架。房东每 14 天确认一次，否则自动过期。"
      />
      <Tabs
        current={status}
        tabs={TAB_ORDER.map((k) => ({
          key: k, label: LISTING_STATUS[k].label, href: `/admin/listings?status=${k}`, count: counts.find((c) => c.status === k)?._count ?? 0,
        }))}
      />
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} placeholder="标题 / 房东 / 邮箱" className="input w-64 py-1.5" />
        <button className="btn-outline btn-sm">搜索</button>
      </form>

      {listings.length === 0 ? (
        <Empty>该状态下没有方案</Empty>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const reports = reportCounts.find((r) => r.targetId === l.id)?._count ?? 0;
            const remote = parseList(l.remoteMethods);
            return (
              <div key={l.id} id={l.id} className="card grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{l.title}</h3>
                    <StatusBadge map={LISTING_STATUS} value={l.status} />
                    <Badge tone={l.availability === "FULL" ? "muted" : "ok"}>
                      {l.availability === "FROM_DATE" && l.availableFrom ? `预计 ${date(l.availableFrom)} 起` : AVAILABILITY[l.availability]}
                    </Badge>
                    {reports > 0 && <Badge tone="danger">被举报 {reports} 次</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {[COUNTRIES[l.country] ?? l.country, l.region, l.city].filter(Boolean).join(" ")} · {l.machineType} {l.chip} · {l.memory}GB / {l.storage}GB
                    {l.osVersion && ` · ${l.osVersion}`}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {ADMIN_ACCESS[l.adminAccess]} · {NETWORK[l.network]}{l.bandwidth && `（${l.bandwidth}）`} · 远程 {remote.join(" / ") || "未填"}
                    {l.ssh && " · SSH"} · {RESTART[l.restart]} · {l.selfInstall ? "可自装软件" : "不可自装软件"}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>{money(l.price, l.currency)} / 月</b>
                    <span className="text-muted"> · 最短 {l.minMonths} 月 · 首期 {money(l.firstPayment, l.currency)} · 押金 {l.deposit ? money(l.deposit, l.currency) : "无"} · 额外费用 {l.extraFees || "无"}</span>
                  </p>
                  <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm whitespace-pre-line text-ink-soft">{l.description}</p>
                  <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted sm:grid-cols-2">
                    {l.paymentMethods && <div>付款方式：{l.paymentMethods}</div>}
                    {l.supportHours && <div>响应时间：{l.supportHours}</div>}
                    {l.deliveryNotes && <div>交付：{l.deliveryNotes}</div>}
                    {l.refundPolicy && <div>退款：{l.refundPolicy}</div>}
                    {l.dataCleanup && <div>数据清理：{l.dataCleanup}</div>}
                    {l.hostWebsite && <div className="truncate">网站：{l.hostWebsite}</div>}
                  </dl>
                  {l.reviewNote && <p className="mt-2 text-sm text-danger">平台意见：{l.reviewNote}</p>}
                  <p className="mt-2 text-xs text-muted">
                    发布 {dateTime(l.publishedAt)} · 房东确认 {ago(l.confirmedAt)} · 有效至 {date(l.expiresAt)} · 浏览 {l.views} · 对话 {l._count.inquiries}
                    {l.status === "PUBLISHED" && <> · <Link href={`/market/${l.id}`} target="_blank" className="text-brand hover:underline">前台查看</Link></>}
                  </p>
                </div>

                <div className="space-y-3 border-line lg:border-l lg:pl-4">
                  <div className="text-sm">
                    <Link href={`/admin/users/${l.host.id}`} className="font-medium text-brand hover:underline">{l.host.name}</Link>
                    <div className="text-xs text-muted">{l.host.email} · 共 {l.host._count.listings} 个方案</div>
                    {l.host.banned && <div className="text-xs text-danger">该账号已暂停</div>}
                    {l.host.restricted && <div className="text-xs text-warn">该账号受限</div>}
                  </div>
                  {["NEEDS_CHANGES", "REMOVED", "EXPIRED"].includes(l.status) && (
                    <form action={reviewListing}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="restore" />
                      <SubmitButton className="btn-safe w-full" confirm="恢复发布并重新计算 14 天有效期？">恢复发布</SubmitButton>
                    </form>
                  )}
                  {["PUBLISHED", "PAUSED"].includes(l.status) && (
                    <form action={reviewListing} className="space-y-2">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="changes" />
                      <textarea name="reviewNote" rows={2} className="input text-xs" placeholder="需要房东修改的地方（房东可见）" />
                      <SubmitButton className="btn-outline w-full">要求修改</SubmitButton>
                    </form>
                  )}
                  {l.status !== "REMOVED" && l.status !== "DRAFT" && (
                    <form action={reviewListing} className="space-y-2">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="remove" />
                      <textarea name="reviewNote" rows={2} className="input text-xs" placeholder="下架原因（房东可见）" />
                      <SubmitButton className="btn-danger w-full" confirm="确定下架该方案？">下架</SubmitButton>
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
