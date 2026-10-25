import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { COMMUNITY_BOARDS, MARKET_LIMITS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash } from "@/components/market/Flash";
import { ReportForm } from "@/components/market/ReportForm";
import { deletePostAction, editPostAction, replyPostAction } from "../../_actions/community";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.communityPost.findUnique({ where: { id }, select: { title: true } });
  return { title: p?.title ?? "交流区" };
}

export default async function PostPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [post, user] = await Promise.all([
    db.communityPost.findUnique({
      where: { id },
      include: { user: { select: { name: true } }, replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } } },
    }),
    getCurrentUser(),
  ]);
  if (!post) notFound();
  const isOwner = user?.id === post.userId;
  if (post.status !== "PUBLISHED" && !isOwner && user?.role !== "ADMIN") notFound();
  if (post.status === "HIDDEN" && isOwner) notFound();
  const back = `/market/community/${id}`;
  const canEdit = isOwner && post.createdAt > new Date(Date.now() - MARKET_LIMITS.postEditMinutes * 60000);
  const replies = post.replies.filter((r) => r.status === "PUBLISHED" || (r.status === "PENDING" && r.userId === user?.id));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/market/community" className="text-sm text-muted hover:text-brand">← 返回交流区</Link>
      <Flash ok={sp.ok} err={sp.err} />
      {post.status === "PENDING" && <Notice tone="info">这篇帖子正在等待审核，审核通过前只有你能看到。</Notice>}
      <article className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.pinned && <Badge tone="info">置顶</Badge>}
          <Badge>{COMMUNITY_BOARDS[post.board] ?? post.board}</Badge>
        </div>
        <h1 className="mt-2 text-xl font-semibold">{post.title}</h1>
        <p className="mt-1 text-xs text-muted">{post.user.name} · {dateTime(post.createdAt)}</p>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{post.body}</div>
        <div className="mt-4 flex items-center justify-end gap-4 border-t border-line pt-3">
          {isOwner && (
            <form action={deletePostAction}>
              <input type="hidden" name="id" value={id} />
              <SubmitButton className="btn-ghost btn-sm" pendingText="…" confirm="删除后不能恢复，确定？">删除</SubmitButton>
            </form>
          )}
          {!isOwner && <ReportForm targetType="POST" targetId={id} returnTo={back} loggedIn={!!user} />}
        </div>
        {canEdit && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-brand">编辑（发布后 {MARKET_LIMITS.postEditMinutes} 分钟内）</summary>
            <form action={editPostAction} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <input name="title" defaultValue={post.title} required minLength={4} maxLength={60} className="input" />
              <textarea name="body" defaultValue={post.body} required minLength={10} maxLength={5000} rows={6} className="input" />
              <SubmitButton className="btn-outline btn-sm">保存</SubmitButton>
            </form>
          </details>
        )}
      </article>

      <section className="space-y-3">
        <h2 className="font-semibold">{replies.length} 条回复</h2>
        {replies.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex justify-between text-xs text-muted">
              <span>{r.user.name} · {dateTime(r.createdAt)} {r.status === "PENDING" && <Badge tone="warn">待审核</Badge>}</span>
              {r.userId !== user?.id && <ReportForm targetType="REPLY" targetId={r.id} returnTo={back} loggedIn={!!user} />}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{r.body}</p>
          </div>
        ))}
        {post.status === "PUBLISHED" && (user ? (
          user.restricted ? (
            <Notice tone="warn">你的账号目前受限，不能回复。</Notice>
          ) : (
            <form action={replyPostAction} className="card space-y-3 p-4">
              <input type="hidden" name="postId" value={id} />
              <textarea name="body" required minLength={2} maxLength={2000} rows={3} className="input" placeholder="写下你的回复，不要留联系方式" />
              <div className="flex justify-end"><SubmitButton pendingText="发送中…">回复</SubmitButton></div>
            </form>
          )
        ) : (
          <Link href={`/login?next=${encodeURIComponent(back)}`} className="btn-outline">登录后回复</Link>
        ))}
      </section>
    </div>
  );
}
