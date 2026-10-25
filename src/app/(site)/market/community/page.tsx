import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { COMMUNITY_BOARDS } from "@/lib/constants";
import { ago } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { Flash } from "@/components/market/Flash";

export const metadata = { title: "交流区 · 租赁市场" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ board?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const board = sp.board && sp.board in COMMUNITY_BOARDS ? sp.board : undefined;
  const user = await getCurrentUser();
  const [posts, mine] = await Promise.all([
    db.communityPost.findMany({
      where: { status: "PUBLISHED", ...(board ? { board } : {}) },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true } }, _count: { select: { replies: { where: { status: "PUBLISHED" } } } } },
      take: 100,
    }),
    user ? db.communityPost.findMany({ where: { userId: user.id, status: "PENDING" }, select: { id: true, title: true } }) : [],
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="交流区"
        desc="交流远程 Mac 的使用和出租经验。帖子公开可见，不要留联系方式；新账号和含链接的帖子需要先审核。"
        actions={<Link href="/market/community/new" className="btn-primary">发新帖</Link>}
      />
      <Flash ok={sp.ok} err={sp.err} />
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/market/community" className={`rounded-full px-3 py-1 ${!board ? "bg-brand text-white" : "bg-surface-2 text-ink-soft"}`}>全部</Link>
        {Object.entries(COMMUNITY_BOARDS).map(([k, v]) => (
          <Link key={k} href={`/market/community?board=${k}`} className={`rounded-full px-3 py-1 ${board === k ? "bg-brand text-white" : "bg-surface-2 text-ink-soft"}`}>{v}</Link>
        ))}
      </nav>
      {mine.length > 0 && (
        <p className="text-sm text-warn">你有 {mine.length} 篇帖子在等待审核：{mine.map((p) => <Link key={p.id} href={`/market/community/${p.id}`} className="ml-1 underline">{p.title}</Link>)}</p>
      )}
      {posts.length === 0 ? (
        <Empty>这个版块还没有帖子。</Empty>
      ) : (
        <div className="card divide-y divide-line">
          {posts.map((p) => (
            <Link key={p.id} href={`/market/community/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {p.pinned && <Badge tone="info">置顶</Badge>}
                  <Badge>{COMMUNITY_BOARDS[p.board] ?? p.board}</Badge>
                  <span className="truncate font-medium">{p.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{p.user.name} · {ago(p.createdAt)}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{p._count.replies} 回复</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
