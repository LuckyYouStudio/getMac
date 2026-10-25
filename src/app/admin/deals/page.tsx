import Link from "next/link";
import { db } from "@/lib/db";
import { DEAL_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { toggleDealHidden, toggleReviewHidden } from "../actions/market";

export const metadata = { title: "成交与评价" };

const CONNECTED: Record<string, string> = { YES: "租客已能连上", NO: "租客还连不上" };

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [deals, counts] = await Promise.all([
    db.deal.findMany({
      where: status ? { status } : {},
      include: {
        proposer: true,
        inquiry: { include: { listing: true, wanted: true, renter: true, host: true } },
        reviews: { include: { author: true, target: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.deal.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div>
      <PageHeader
        title="成交与评价"
        desc="双方确认的成交计入房东主页的“合作次数”。可疑的刷单可设为不计入；不当评价可隐藏。"
      />
      <Tabs
        current={status}
        tabs={[
          { key: "", label: "全部", href: "/admin/deals", count: counts.reduce((s, c) => s + c._count, 0) },
          ...Object.entries(DEAL_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: `/admin/deals?status=${k}`, count: counts.find((c) => c.status === k)?._count ?? 0 })),
        ]}
      />
      {deals.length === 0 ? (
        <Empty>暂无成交记录</Empty>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => {
            const i = d.inquiry;
            return (
              <div key={d.id} className={`card p-5 ${d.hidden ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge map={DEAL_STATUS} value={d.status} />
                      {d.hidden && <Badge tone="danger">不计入统计</Badge>}
                      <Link href={`/admin/inquiries/${i.id}`} className="font-semibold hover:text-brand">
                        {i.listing?.title ?? (i.wanted ? `回应求租：${i.wanted.title}` : "对话")}
                      </Link>
                    </div>
                    <p className="mt-1 text-muted">
                      房东 <Link href={`/admin/users/${i.host.id}`} className="hover:text-brand">{i.host.name}</Link> · 租客{" "}
                      <Link href={`/admin/users/${i.renter.id}`} className="hover:text-brand">{i.renter.name}</Link> · {d.proposer.name} 发起于 {dateTime(d.createdAt)}
                      {d.confirmedAt && ` · 确认于 ${dateTime(d.confirmedAt)}`}
                    </p>
                    {d.status === "CONFIRMED" && (
                      <p className="mt-1 text-xs text-ink-soft">
                        交付记录：{d.hostDelivered ? "房东已标记交付" : "房东未标记交付"} · {d.renterConnected ? CONNECTED[d.renterConnected] : "租客未反馈"}
                      </p>
                    )}
                  </div>
                  <form action={toggleDealHidden}>
                    <input type="hidden" name="id" value={d.id} />
                    <SubmitButton className={d.hidden ? "btn-outline btn-sm" : "btn-ghost btn-sm text-danger"} confirm={d.hidden ? undefined : "设为不计入房东的合作次数？"}>
                      {d.hidden ? "恢复计入" : "不计入统计"}
                    </SubmitButton>
                  </form>
                </div>
                {d.reviews.length > 0 && (
                  <ul className="mt-3 divide-y divide-line rounded-lg bg-surface-2 px-3">
                    {d.reviews.map((r) => (
                      <li key={r.id} className={`flex items-start justify-between gap-3 py-2 text-sm ${r.hidden ? "opacity-50" : ""}`}>
                        <div className="min-w-0">
                          <b className="font-medium">{r.author.name}</b> → {r.target.name}{" "}
                          <span className="text-warn">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                          <div>{r.body}</div>
                          {r.reply && <div className="text-xs text-muted">回复：{r.reply}</div>}
                          <div className="text-xs text-muted">{r.publishedAt ? `公开于 ${dateTime(r.publishedAt)}` : "尚未公开（等待对方评价）"}{r.hidden && " · 已隐藏"}</div>
                        </div>
                        <form action={toggleReviewHidden}>
                          <input type="hidden" name="id" value={r.id} />
                          <SubmitButton className="btn-ghost btn-sm">{r.hidden ? "恢复" : "隐藏"}</SubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
