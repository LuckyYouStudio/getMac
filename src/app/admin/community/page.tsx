import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { togglePost, toggleReply } from "../actions/market";

export const metadata = { title: "交流区管理" };

export default async function CommunityAdmin({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;
  const posts = await db.communityPost.findMany({
    include: { user: true, replies: { include: { user: true }, orderBy: { createdAt: "asc" } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div>
      <PageHeader title="交流区" desc="隐藏的内容前台不可见，可随时恢复。" />
      {posts.length === 0 ? (
        <Empty>暂无帖子</Empty>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className={`card p-5 ${p.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.pinned && <Badge tone="info">置顶</Badge>}
                    {p.hidden && <Badge tone="danger">已隐藏</Badge>}
                    <Link href={`/market/community/${p.id}`} target="_blank" className="font-semibold hover:text-brand">{p.title}</Link>
                  </div>
                  <p className="mt-1 text-xs text-muted">{p.user.name} · {dateTime(p.createdAt)} · {p.replies.length} 条回复</p>
                  <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line text-ink-soft">{p.body}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <form action={togglePost}>
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="pinned" />
                    <SubmitButton className="btn-outline btn-sm">{p.pinned ? "取消置顶" : "置顶"}</SubmitButton>
                  </form>
                  <form action={togglePost}>
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="hidden" />
                    <SubmitButton className={p.hidden ? "btn-outline btn-sm" : "btn-danger btn-sm"}>{p.hidden ? "恢复" : "隐藏"}</SubmitButton>
                  </form>
                </div>
              </div>
              {p.replies.length > 0 && (
                open === p.id ? (
                  <ul className="mt-3 divide-y divide-line rounded-lg bg-surface-2 px-3">
                    {p.replies.map((r) => (
                      <li key={r.id} className={`flex items-start justify-between gap-3 py-2 text-sm ${r.hidden ? "opacity-50" : ""}`}>
                        <div><b className="font-medium">{r.user.name}</b>：{r.body}<div className="text-xs text-muted">{dateTime(r.createdAt)}</div></div>
                        <form action={toggleReply}>
                          <input type="hidden" name="id" value={r.id} />
                          <SubmitButton className="btn-ghost btn-sm">{r.hidden ? "恢复" : "隐藏"}</SubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Link href={`/admin/community?open=${p.id}`} className="mt-2 inline-block text-xs text-brand hover:underline">管理回复 →</Link>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
