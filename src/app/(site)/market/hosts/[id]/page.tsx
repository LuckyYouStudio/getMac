import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { date } from "@/lib/format";
import { Empty } from "@/components/ui";
import { Flash } from "@/components/market/Flash";
import { HostCard } from "@/components/market/HostCard";
import { ListingCard } from "@/components/market/ListingCard";
import { ReportForm } from "@/components/market/ReportForm";
import { hostStats } from "../../_server/reviews";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: u ? `${u.name} 的主页` : "房东主页" };
}

export default async function HostPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await expireStaleMarket();
  const [host, viewer] = await Promise.all([
    db.user.findUnique({ where: { id }, select: { id: true, name: true, createdAt: true, bio: true, banned: true } }),
    getCurrentUser(),
  ]);
  if (!host || host.banned) notFound();
  const [listings, stats] = await Promise.all([
    db.listing.findMany({
      where: { hostId: id, status: "PUBLISHED" },
      orderBy: { confirmedAt: "desc" },
      include: { host: { select: { name: true } } },
    }),
    hostStats(id),
  ]);
  const back = `/market/hosts/${id}`;

  return (
    <div className="space-y-6">
      <Link href="/market" className="text-sm text-muted hover:text-brand">← 返回找设备</Link>
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <HostCard host={host} compact />
          {host.bio && <div className="card p-5 text-sm leading-6 text-ink-soft">{host.bio}</div>}
          {viewer?.id !== id && <ReportForm targetType="USER" targetId={id} returnTo={back} loggedIn={!!viewer} label="举报这个用户" />}
        </aside>
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold">发布中的方案（{listings.length}）</h2>
            {listings.length ? (
              <div className="grid gap-4 md:grid-cols-2">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
            ) : (
              <Empty>目前没有发布中的方案。</Empty>
            )}
          </section>
          <section>
            <h2 className="mb-3 font-semibold">收到的评价（{stats.reviews.length}）</h2>
            {stats.reviews.length ? (
              <div className="card divide-y divide-line">
                {stats.reviews.map((r) => (
                  <div key={r.id} className="px-5 py-4 text-sm">
                    <div className="flex justify-between text-xs text-muted">
                      <span><span className="text-warn">{"★".repeat(r.rating)}</span><span className="text-line-strong">{"★".repeat(5 - r.rating)}</span> · {r.author.name}</span>
                      <span>{date(r.publishedAt)}</span>
                    </div>
                    <p className="mt-1.5 text-ink-soft">{r.body}</p>
                    {r.reply && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-soft">房东回复：{r.reply}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>还没有公开的评价。评价只来自双方确认成交的对方。</Empty>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
