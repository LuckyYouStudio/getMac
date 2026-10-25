import Link from "next/link";
import { db } from "@/lib/db";
import { WANTED_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { setWantedStatus } from "../actions/market";

export const metadata = { title: "求租帖" };

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [posts, counts] = await Promise.all([
    db.wantedPost.findMany({ where: status ? { status } : {}, include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.wantedPost.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <div>
      <PageHeader title="求租帖" />
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
            <thead><tr><th>标题</th><th>地区 / 预算</th><th>发布人</th><th>状态</th><th>时间</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {posts.map((w) => (
                <tr key={w.id}>
                  <td className="max-w-md">
                    <div className="font-medium">{w.title}</div>
                    <div className="line-clamp-2 text-xs text-muted">{w.requirements}</div>
                  </td>
                  <td className="text-muted">{w.region || "不限"}<br />{w.budget || "—"}</td>
                  <td><Link href={`/admin/users/${w.user.id}`} className="text-brand hover:underline">{w.user.name}</Link></td>
                  <td><StatusBadge map={WANTED_STATUS} value={w.status} /></td>
                  <td className="text-muted">{dateTime(w.createdAt)}</td>
                  <td className="text-right whitespace-nowrap">
                    {(["OPEN", "CLOSED", "HIDDEN"] as const).filter((s) => s !== w.status).map((s) => (
                      <form key={s} action={setWantedStatus} className="inline">
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="status" value={s} />
                        <SubmitButton className={s === "HIDDEN" ? "btn-ghost btn-sm text-danger" : "btn-ghost btn-sm"}>
                          {{ OPEN: "恢复求租", CLOSED: "标记已找到", HIDDEN: "隐藏" }[s]}
                        </SubmitButton>
                      </form>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
