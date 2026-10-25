import Link from "next/link";
import { db } from "@/lib/db";
import { COUNTRIES, MARKET_LIMITS, WANTED_STATUS } from "@/lib/constants";
import { date, dateTime } from "@/lib/format";
import { parseList } from "@/lib/json";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { setWantedStatus } from "../actions/market";

export const metadata = { title: "求租帖" };

const ACTION_LABEL: Record<string, string> = { OPEN: "恢复征集", FILLED: "标记已租到", CLOSED: "关闭", HIDDEN: "隐藏" };

function budget(min: number | null, max: number | null) {
  if (min && max) return `USD ${min}–${max} / 月`;
  if (max) return `USD ${max} 以内 / 月`;
  if (min) return `USD ${min} 起 / 月`;
  return "预算未填";
}

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await expireStaleMarket();
  const { status = "" } = await searchParams;
  const [posts, counts] = await Promise.all([
    db.wantedPost.findMany({
      where: status ? { status } : {},
      include: { user: true, _count: { select: { responses: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.wantedPost.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <div>
      <PageHeader title="求租帖" desc={`每帖最多 ${MARKET_LIMITS.wantedMaxResponses} 位房东回应；14 天未确认自动过期。`} />
      <Tabs
        current={status}
        tabs={[
          { key: "", label: "全部", href: "/admin/wanted", count: counts.reduce((s, c) => s + c._count, 0) },
          ...Object.entries(WANTED_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: `/admin/wanted?status=${k}`, count: counts.find((c) => c.status === k)?._count ?? 0 })),
        ]}
      />
      {posts.length === 0 ? (
        <Empty>暂无求租帖</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>标题 / 要求</th><th>地区 / 预算</th><th>发布人</th><th>回应</th><th>状态</th><th>时间</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {posts.map((w) => {
                const req = [
                  w.chipMin && `${w.chipMin} 起`,
                  w.memMin && `${w.memMin}GB 起`,
                  w.adminNeeded && "需要管理员权限",
                  `${w.termMonths} 个月`,
                  ...parseList(w.remoteMethods),
                ].filter(Boolean);
                return (
                  <tr key={w.id}>
                    <td className="max-w-md">
                      <Link href={`/market/wanted/${w.id}`} target="_blank" className="font-medium hover:text-brand">{w.title}</Link>
                      <div className="text-xs text-ink-soft">用途：{w.purpose} · {req.join(" · ")}</div>
                      <div className="line-clamp-2 text-xs text-muted">{w.description}</div>
                    </td>
                    <td className="text-muted">
                      {[w.country && (COUNTRIES[w.country] ?? w.country), w.region].filter(Boolean).join(" ") || "不限"}
                      <div>{budget(w.budgetMin, w.budgetMax)}</div>
                      {w.startDate && <div className="text-xs">{date(w.startDate)} 起</div>}
                    </td>
                    <td><Link href={`/admin/users/${w.user.id}`} className="text-brand hover:underline">{w.user.name}</Link></td>
                    <td>{w._count.responses} / {MARKET_LIMITS.wantedMaxResponses}</td>
                    <td><StatusBadge map={WANTED_STATUS} value={w.status} /></td>
                    <td className="text-xs text-muted">发布 {dateTime(w.createdAt)}<br />有效至 {date(w.expiresAt)}</td>
                    <td className="text-right whitespace-nowrap">
                      {(["OPEN", "FILLED", "CLOSED", "HIDDEN"] as const).filter((s) => s !== w.status).map((s) => (
                        <form key={s} action={setWantedStatus} className="inline">
                          <input type="hidden" name="id" value={w.id} />
                          <input type="hidden" name="status" value={s} />
                          <SubmitButton className={s === "HIDDEN" ? "btn-ghost btn-sm text-danger" : "btn-ghost btn-sm"}>{ACTION_LABEL[s]}</SubmitButton>
                        </form>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
