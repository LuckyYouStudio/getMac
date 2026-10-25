import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ago } from "@/lib/format";
import { Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ReportForm, ReportResult } from "@/components/market/ReportForm";
import { createReplyAction } from "../../actions";

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ report?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const post = await db.communityPost.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, hostStatus: true } },
      replies: { where: { hidden: false }, orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!post || post.hidden) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/market/community" className="text-sm text-muted hover:text-brand">← 返回交流区</Link>
      <ReportResult value={sp.report} />
      <article className="card p-6">
        <div className="flex items-center gap-2">
          {post.pinned && <Badge tone="info">置顶</Badge>}
          <h1 className="text-xl font-semibold">{post.title}</h1>
        </div>
        <p className="mt-1 text-xs text-muted">
          {post.user.name}{post.user.hostStatus === "VERIFIED" && " · 认证房东"} · {ago(post.createdAt)}
        </p>
        <div className="mt-5 whitespace-pre-wrap leading-7 text-ink-soft">{post.body}</div>
        {user && (
          <div className="mt-6 border-t border-line pt-3">
            <ReportForm targetType="POST" targetId={post.id} returnTo={`/market/community/${post.id}`} />
          </div>
        )}
      </article>

      <section id="replies" className="scroll-mt-24">
        <h2 className="mb-3 font-semibold">{post.replies.length} 条回复</h2>
        <div className="space-y-3">
          {post.replies.map((r) => (
            <div key={r.id} className="card p-4">
              <p className="text-xs text-muted">{r.user.name} · {ago(r.createdAt)}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{r.body}</p>
            </div>
          ))}
        </div>
        <div className="card mt-4 p-4">
          {user ? (
            <form action={createReplyAction} className="space-y-3">
              <input type="hidden" name="postId" value={post.id} />
              <textarea name="body" required maxLength={2000} rows={3} className="input" placeholder="写下你的回复…" />
              <SubmitButton pendingText="发送中…">回复</SubmitButton>
            </form>
          ) : (
            <Link href={`/login?next=/market/community/${post.id}`} className="btn-primary">登录后回复</Link>
          )}
        </div>
      </section>
    </div>
  );
}
