import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ago } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createPostAction } from "../actions";

export const metadata = { title: "交流区 · 租赁市场" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const posts = await db.communityPost.findMany({
    where: { hidden: false },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true } }, _count: { select: { replies: { where: { hidden: false } } } } },
    take: 100,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <PageHeader title="交流区" desc="分享远程 Mac 的使用经验、踩过的坑，房东和租客都欢迎。" />
        {posts.length === 0 ? (
          <Empty>还没有帖子，来发第一篇吧。</Empty>
        ) : (
          <div className="card divide-y divide-line">
            {posts.map((p) => (
              <Link key={p.id} href={`/market/community/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2/60">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {p.pinned && <Badge tone="info">置顶</Badge>}
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

      <aside id="new" className="scroll-mt-24">
        <div className="card p-5">
          <h2 className="font-semibold">发新帖</h2>
          {user ? (
            <form action={createPostAction} className="mt-4 space-y-3">
              <input name="title" required minLength={4} maxLength={80} className="input" placeholder="标题" />
              <textarea name="body" required minLength={10} maxLength={5000} rows={7} className="input" placeholder="说点什么…" />
              {sp.err && <p className="text-sm text-danger">标题至少 4 字，正文至少 10 字。</p>}
              <SubmitButton className="btn-primary w-full" pendingText="发布中…">发布</SubmitButton>
              <p className="hint">友善交流，请勿发布广告或站外交易信息。</p>
            </form>
          ) : (
            <Link href="/login?next=/market/community" className="btn-primary mt-4 w-full">登录后发帖</Link>
          )}
        </div>
      </aside>
    </div>
  );
}
