import Link from "next/link";
import { db } from "@/lib/db";
import { REPORT_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { handleReport } from "../actions/market";

export const metadata = { title: "举报处理" };

const TYPE_LABEL: Record<string, string> = { LISTING: "出租方案", WANTED: "求租帖", POST: "交流帖", USER: "用户" };
const TAKEDOWN_LABEL: Record<string, string> = { LISTING: "同时下架该方案", WANTED: "同时隐藏该求租帖", POST: "同时隐藏该帖子", USER: "同时封禁该用户" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "OPEN" } = await searchParams;
  const [reports, counts] = await Promise.all([
    db.report.findMany({ where: { status }, include: { reporter: true }, orderBy: { createdAt: status === "OPEN" ? "asc" : "desc" }, take: 100 }),
    db.report.groupBy({ by: ["status"], _count: true }),
  ]);

  // 批量取被举报对象的摘要
  const ids = (t: string) => reports.filter((r) => r.targetType === t).map((r) => r.targetId);
  const [listings, wanted, posts, users] = await Promise.all([
    db.listing.findMany({ where: { id: { in: ids("LISTING") } }, include: { host: true } }),
    db.wantedPost.findMany({ where: { id: { in: ids("WANTED") } }, include: { user: true } }),
    db.communityPost.findMany({ where: { id: { in: ids("POST") } }, include: { user: true } }),
    db.user.findMany({ where: { id: { in: ids("USER") } } }),
  ]);
  function target(type: string, id: string) {
    switch (type) {
      case "LISTING": {
        const l = listings.find((x) => x.id === id);
        return l && { title: l.title, sub: `房东 ${l.host.name} · ${l.status}`, href: `/market/${l.id}`, owner: l.host.id };
      }
      case "WANTED": {
        const w = wanted.find((x) => x.id === id);
        return w && { title: w.title, sub: `发布人 ${w.user.name} · ${w.status}`, href: "/admin/wanted", owner: w.user.id };
      }
      case "POST": {
        const p = posts.find((x) => x.id === id);
        return p && { title: p.title, sub: `作者 ${p.user.name}${p.hidden ? " · 已隐藏" : ""}`, href: `/market/community/${p.id}`, owner: p.user.id };
      }
      case "USER": {
        const u = users.find((x) => x.id === id);
        return u && { title: u.name, sub: `${u.email}${u.banned ? " · 已封禁" : ""}`, href: `/admin/users/${u.id}`, owner: u.id };
      }
    }
  }

  return (
    <div>
      <PageHeader title="举报处理" />
      <Tabs
        current={status}
        tabs={Object.entries(REPORT_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: `/admin/reports?status=${k}`, count: counts.find((c) => c.status === k)?._count ?? 0 }))}
      />
      {reports.length === 0 ? (
        <Empty>没有{REPORT_STATUS[status]?.label ?? ""}的举报</Empty>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const t = target(r.targetType, r.targetId);
            return (
              <div key={r.id} className="card grid gap-4 p-5 lg:grid-cols-[1fr_300px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{TYPE_LABEL[r.targetType] ?? r.targetType}</Badge>
                    <StatusBadge map={REPORT_STATUS} value={r.status} />
                    <span className="text-xs text-muted">{dateTime(r.createdAt)} · 举报人 {r.reporter.name}（{r.reporter.email}）</span>
                  </div>
                  <p className="mt-2 text-sm">{r.reason}</p>
                  <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
                    {t ? (
                      <>
                        <Link href={t.href} target="_blank" className="font-medium text-brand hover:underline">{t.title}</Link>
                        <div className="text-xs text-muted">
                          {t.sub} · <Link href={`/admin/users/${t.owner}`} className="hover:underline">查看所属用户</Link>
                        </div>
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
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" name="takedown" /> {TAKEDOWN_LABEL[r.targetType]}
                      </label>
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
