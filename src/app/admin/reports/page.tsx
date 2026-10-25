import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LISTING_STATUS, POST_STATUS, REPORT_CATEGORIES, REPORT_STATUS, REPORT_TARGETS, WANTED_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { handleReport } from "../actions/market";

export const metadata = { title: "举报处理" };

const TAKEDOWN_LABEL: Record<string, string> = {
  LISTING: "下架该方案",
  WANTED: "隐藏该求租帖",
  POST: "隐藏该帖子",
  REPLY: "隐藏该回复",
  REVIEW: "隐藏该评价",
};

type Target = {
  title: string;
  sub: string;
  href?: string;
  owner?: string;
  /** 私信举报：被举报消息及前后各 2 条 */
  evidence?: { id: string; who: string; body: string; at: Date }[];
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; type?: string }> }) {
  const { status = "OPEN", category = "", type = "" } = await searchParams;
  const where: Prisma.ReportWhereInput = { status, ...(category ? { category } : {}), ...(type ? { targetType: type } : {}) };
  const [reports, counts] = await Promise.all([
    db.report.findMany({ where, include: { reporter: true }, orderBy: { createdAt: status === "OPEN" ? "asc" : "desc" }, take: 100 }),
    db.report.groupBy({ by: ["status"], _count: true }),
  ]);

  // 批量取被举报对象的摘要
  const ids = (t: string) => reports.filter((r) => r.targetType === t).map((r) => r.targetId);
  const [listings, wanted, posts, replies, messages, reviews, users] = await Promise.all([
    db.listing.findMany({ where: { id: { in: ids("LISTING") } }, include: { host: true } }),
    db.wantedPost.findMany({ where: { id: { in: ids("WANTED") } }, include: { user: true } }),
    db.communityPost.findMany({ where: { id: { in: ids("POST") } }, include: { user: true } }),
    db.communityReply.findMany({ where: { id: { in: ids("REPLY") } }, include: { user: true, post: true } }),
    db.message.findMany({ where: { id: { in: ids("MESSAGE") } }, include: { sender: true } }),
    db.review.findMany({ where: { id: { in: ids("REVIEW") } }, include: { author: true, target: true } }),
    db.user.findMany({ where: { id: { in: ids("USER") } } }),
  ]);
  // 私信证据：同一对话里被举报消息前后各 2 条
  const evidence = new Map<string, Target["evidence"]>();
  for (const m of messages) {
    const thread = await db.message.findMany({ where: { inquiryId: m.inquiryId }, include: { sender: true }, orderBy: { createdAt: "asc" } });
    const i = thread.findIndex((x) => x.id === m.id);
    evidence.set(
      m.id,
      thread.slice(Math.max(0, i - 2), i + 3).map((x) => ({ id: x.id, who: x.sender.name, body: x.body, at: x.createdAt })),
    );
  }

  function target(t: string, id: string): Target | undefined {
    switch (t) {
      case "LISTING": {
        const l = listings.find((x) => x.id === id);
        return l && { title: l.title, sub: `房东 ${l.host.name} · ${LISTING_STATUS[l.status]?.label ?? l.status}`, href: `/market/${l.id}`, owner: l.host.id };
      }
      case "WANTED": {
        const w = wanted.find((x) => x.id === id);
        return w && { title: w.title, sub: `发布人 ${w.user.name} · ${WANTED_STATUS[w.status]?.label ?? w.status}`, href: `/market/wanted/${w.id}`, owner: w.user.id };
      }
      case "POST": {
        const p = posts.find((x) => x.id === id);
        return p && { title: p.title, sub: `作者 ${p.user.name} · ${POST_STATUS[p.status]?.label ?? p.status}`, href: `/market/community/${p.id}`, owner: p.user.id };
      }
      case "REPLY": {
        const r = replies.find((x) => x.id === id);
        return r && { title: r.body, sub: `${r.user.name} 回复《${r.post.title}》 · ${POST_STATUS[r.status]?.label ?? r.status}`, href: `/market/community/${r.postId}`, owner: r.user.id };
      }
      case "MESSAGE": {
        const m = messages.find((x) => x.id === id);
        return m && { title: m.body, sub: `发送人 ${m.sender.name} · ${dateTime(m.createdAt)}`, href: `/admin/inquiries/${m.inquiryId}`, owner: m.senderId, evidence: evidence.get(m.id) };
      }
      case "REVIEW": {
        const v = reviews.find((x) => x.id === id);
        return v && { title: `${"★".repeat(v.rating)} ${v.body}`, sub: `${v.author.name} 评价 ${v.target.name}${v.hidden ? " · 已隐藏" : ""}`, href: "/admin/deals", owner: v.authorId };
      }
      case "USER": {
        const u = users.find((x) => x.id === id);
        return u && { title: u.name, sub: `${u.email}${u.banned ? " · 已暂停" : u.restricted ? " · 受限" : ""}`, href: `/market/hosts/${u.id}`, owner: u.id };
      }
    }
  }
  const qs = (o: Record<string, string>) => {
    const sp = new URLSearchParams({ status, ...(category && { category }), ...(type && { type }), ...o });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    return `/admin/reports?${sp}`;
  };

  return (
    <div>
      <PageHeader title="举报处理" desc="私信举报会附上前后各 2 条消息作为证据。处理时可同时下架内容或限制 / 暂停发布者。" />
      <Tabs
        current={status}
        tabs={Object.entries(REPORT_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: qs({ status: k }), count: counts.find((c) => c.status === k)?._count ?? 0 }))}
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="status" value={status} />
        <select name="category" defaultValue={category} className="input w-auto py-1.5 text-sm">
          <option value="">全部类别</option>
          {Object.entries(REPORT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="type" defaultValue={type} className="input w-auto py-1.5 text-sm">
          <option value="">全部对象</option>
          {Object.entries(REPORT_TARGETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-outline btn-sm">筛选</button>
      </form>

      {reports.length === 0 ? (
        <Empty>没有{REPORT_STATUS[status]?.label ?? ""}的举报</Empty>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const t = target(r.targetType, r.targetId);
            return (
              <div key={r.id} className="card grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="danger">{REPORT_CATEGORIES[r.category] ?? r.category}</Badge>
                    <Badge tone="info">{REPORT_TARGETS[r.targetType] ?? r.targetType}</Badge>
                    <StatusBadge map={REPORT_STATUS} value={r.status} />
                    <span className="text-xs text-muted">
                      {dateTime(r.createdAt)} · 举报人 <Link href={`/admin/users/${r.reporter.id}`} className="hover:text-brand">{r.reporter.name}</Link>
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{r.reason}</p>
                  <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
                    {t ? (
                      <>
                        {t.href ? (
                          <Link href={t.href} target="_blank" className="line-clamp-2 font-medium text-brand hover:underline">{t.title}</Link>
                        ) : (
                          <span className="font-medium">{t.title}</span>
                        )}
                        <div className="text-xs text-muted">
                          {t.sub}
                          {t.owner && <> · <Link href={`/admin/users/${t.owner}`} className="hover:underline">查看发布者</Link></>}
                        </div>
                        {t.evidence && (
                          <ul className="mt-2 space-y-1 border-t border-line pt-2 text-xs">
                            {t.evidence.map((e) => (
                              <li key={e.id} className={e.id === r.targetId ? "rounded bg-danger-soft px-1.5 py-1 text-danger" : "px-1.5 text-ink-soft"}>
                                <b>{e.who}</b> · {dateTime(e.at)}：{e.body}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">被举报对象已不存在</span>
                    )}
                  </div>
                  {r.handleNote && <p className="mt-2 text-xs text-muted">处理备注：{r.handleNote}</p>}
                </div>
                {r.status === "OPEN" && (
                  <form action={handleReport} className="space-y-2 lg:border-l lg:border-line lg:pl-4">
                    <input type="hidden" name="id" value={r.id} />
                    <textarea name="handleNote" rows={2} className="input text-xs" placeholder="处理备注" />
                    {t && (
                      <select name="action" defaultValue="none" className="input text-sm">
                        <option value="none">只记录，不做处置</option>
                        {TAKEDOWN_LABEL[r.targetType] && <option value="takedown">{TAKEDOWN_LABEL[r.targetType]}</option>}
                        {t.owner && <option value="restrict">限制发布者（不能发起对话和发布）</option>}
                        {t.owner && <option value="ban">暂停发布者账号</option>}
                      </select>
                    )}
                    <div className="flex gap-2">
                      <button name="status" value="RESOLVED" className="btn-safe flex-1">处理完成</button>
                      <button name="status" value="DISMISSED" className="btn-outline flex-1">驳回举报</button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
