import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { COMMUNITY_BOARDS, POST_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { hasLink } from "@/lib/contact-guard";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { setPostStatus, setReplyStatus, togglePin } from "../actions/market";

export const metadata = { title: "交流区管理" };

export default async function CommunityAdmin({ searchParams }: { searchParams: Promise<{ status?: string; board?: string; open?: string }> }) {
  const { status = "", board = "", open } = await searchParams;
  const where: Prisma.CommunityPostWhereInput = { ...(status ? { status } : {}), ...(board ? { board } : {}) };
  const [posts, counts, pendingReplies] = await Promise.all([
    db.communityPost.findMany({
      where,
      include: { user: true, replies: { include: { user: true }, orderBy: { createdAt: "asc" } } },
      orderBy: status === "PENDING" ? { createdAt: "asc" } : [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    db.communityPost.groupBy({ by: ["status"], _count: true }),
    db.communityReply.findMany({ where: { status: "PENDING" }, include: { user: true, post: true }, orderBy: { createdAt: "asc" }, take: 50 }),
  ]);
  const qs = (o: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status && { status }), ...(board && { board }), ...o });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    return `/admin/community?${sp}`;
  };

  return (
    <div>
      <PageHeader title="交流区" desc="新账号的帖子和含链接的帖子先进入待审核；隐藏的内容前台不可见，可随时恢复。" />
      <Tabs
        current={status}
        tabs={[
          { key: "", label: "全部", href: qs({ status: "" }), count: counts.reduce((s, c) => s + c._count, 0) },
          ...Object.entries(POST_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: qs({ status: k }), count: counts.find((c) => c.status === k)?._count ?? 0 })),
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={qs({ board: "" })} className={!board ? "btn-primary btn-sm" : "btn-outline btn-sm"}>全部版块</Link>
        {Object.entries(COMMUNITY_BOARDS).map(([k, v]) => (
          <Link key={k} href={qs({ board: k })} className={board === k ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{v}</Link>
        ))}
      </div>

      {pendingReplies.length > 0 && (
        <section className="card mb-4 p-5">
          <h2 className="mb-2 font-semibold">待审核回复 <span className="text-sm font-normal text-muted">{pendingReplies.length}</span></h2>
          <ul className="divide-y divide-line">
            {pendingReplies.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <b className="font-medium">{r.user.name}</b> 回复《{r.post.title}》：{r.body}
                  <div className="text-xs text-muted">{dateTime(r.createdAt)}</div>
                </div>
                <div className="flex gap-1">
                  <ReplyButton id={r.id} status="PUBLISHED" label="通过" className="btn-safe btn-sm" />
                  <ReplyButton id={r.id} status="HIDDEN" label="隐藏" className="btn-danger btn-sm" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length === 0 ? (
        <Empty>暂无帖子</Empty>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className={`card p-5 ${p.status === "HIDDEN" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.pinned && <Badge tone="info">置顶</Badge>}
                    <StatusBadge map={POST_STATUS} value={p.status} />
                    <Badge>{COMMUNITY_BOARDS[p.board] ?? p.board}</Badge>
                    {hasLink(p.body) && <Badge tone="warn">含链接</Badge>}
                    <Link href={`/market/community/${p.id}`} target="_blank" className="font-semibold hover:text-brand">{p.title}</Link>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    <Link href={`/admin/users/${p.user.id}`} className="hover:text-brand">{p.user.name}</Link> · {dateTime(p.createdAt)} · {p.replies.length} 条回复
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line text-ink-soft">{p.body}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {p.status !== "PUBLISHED" && (
                    <PostButton id={p.id} status="PUBLISHED" label={p.status === "PENDING" ? "审核通过" : "恢复"} className="btn-safe btn-sm" />
                  )}
                  {p.status !== "HIDDEN" && <PostButton id={p.id} status="HIDDEN" label="隐藏" className="btn-danger btn-sm" />}
                  <form action={togglePin}>
                    <input type="hidden" name="id" value={p.id} />
                    <SubmitButton className="btn-outline btn-sm">{p.pinned ? "取消置顶" : "置顶"}</SubmitButton>
                  </form>
                </div>
              </div>
              {p.replies.length > 0 &&
                (open === p.id ? (
                  <ul className="mt-3 divide-y divide-line rounded-lg bg-surface-2 px-3">
                    {p.replies.map((r) => (
                      <li key={r.id} className={`flex items-start justify-between gap-3 py-2 text-sm ${r.status === "HIDDEN" ? "opacity-50" : ""}`}>
                        <div className="min-w-0">
                          <b className="font-medium">{r.user.name}</b>：{r.body}
                          <div className="text-xs text-muted">{dateTime(r.createdAt)} · {POST_STATUS[r.status]?.label}</div>
                        </div>
                        <ReplyButton
                          id={r.id}
                          status={r.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED"}
                          label={r.status === "PUBLISHED" ? "隐藏" : r.status === "PENDING" ? "通过" : "恢复"}
                          className="btn-ghost btn-sm"
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Link href={qs({ open: p.id })} className="mt-2 inline-block text-xs text-brand hover:underline">管理回复 →</Link>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostButton({ id, status, label, className }: { id: string; status: string; label: string; className: string }) {
  return (
    <form action={setPostStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={className}>{label}</SubmitButton>
    </form>
  );
}

function ReplyButton({ id, status, label, className }: { id: string; status: string; label: string; className: string }) {
  return (
    <form action={setReplyStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={className}>{label}</SubmitButton>
    </form>
  );
}
