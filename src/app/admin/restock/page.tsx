import Link from "next/link";
import { db } from "@/lib/db";
import { RESTOCK_STATUS } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { availableByPlan } from "@/lib/reservations";
import { Badge, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { setRestockStatus } from "../actions/business";

export const metadata = { title: "到货通知" };

export default async function RestockPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "OPEN" } = await searchParams;
  const [plans, alerts, free] = await Promise.all([
    db.plan.findMany({ orderBy: { sort: "asc" } }),
    db.restockAlert.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "asc" } }),
    availableByPlan(),
  ]);

  return (
    <div>
      <PageHeader title="到货通知" desc="某档缺货时用户登记的联系方式。有空闲机器后逐一联系，再标记为已通知。" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[["OPEN", "等待到货"], ["NOTIFIED", "已通知"], ["CLOSED", "已关闭"], ["", "全部"]].map(([k, label]) => (
          <Link key={k} href={`/admin/restock?status=${k}`} className={status === k ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{label}</Link>
        ))}
      </div>

      <div className="space-y-4">
        {plans.map((p) => {
          const list = alerts.filter((a) => a.planId === p.id);
          const avail = free.get(p.id) ?? 0;
          return (
            <section key={p.id} className="card overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <h2 className="font-semibold">
                  {p.name}档 <span className="text-sm font-normal text-muted">· {list.length} 条登记</span>
                </h2>
                <div className="flex items-center gap-2">
                  {avail ? <Badge tone="ok">当前空闲 {avail} 台</Badge> : <Badge tone="danger">仍缺货</Badge>}
                  {list.length > 0 && status === "OPEN" && (
                    <form action={setRestockStatus}>
                      {list.map((a) => <input key={a.id} type="hidden" name="id" value={a.id} />)}
                      <input type="hidden" name="status" value="NOTIFIED" />
                      <SubmitButton className="btn-safe btn-sm" confirm={`把 ${p.name}档的 ${list.length} 条登记全部标为已通知？`}>全部标为已通知</SubmitButton>
                    </form>
                  )}
                </div>
              </div>
              {list.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted">没有登记</p>
              ) : (
                <table className="table">
                  <thead><tr><th>登记时间</th><th>联系方式</th><th>用途</th><th>状态</th><th className="text-right">操作</th></tr></thead>
                  <tbody>
                    {list.map((a) => (
                      <tr key={a.id}>
                        <td className="whitespace-nowrap text-muted">{dateTime(a.createdAt)}</td>
                        <td className="text-sm">
                          {[a.phone && `${a.phoneCountry ?? ""} ${a.phone}`, a.email, a.wechat && `微信 ${a.wechat}`].filter(Boolean).join(" · ")}
                        </td>
                        <td className="max-w-xs text-sm text-ink-soft">{a.usage || "—"}</td>
                        <td><StatusBadge map={RESTOCK_STATUS} value={a.status} /></td>
                        <td className="text-right whitespace-nowrap">
                          {Object.keys(RESTOCK_STATUS).filter((k) => k !== a.status).map((k) => (
                            <form key={k} action={setRestockStatus} className="inline">
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value={k} />
                              <SubmitButton className="btn-ghost btn-sm">标为{RESTOCK_STATUS[k].label}</SubmitButton>
                            </form>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
        {alerts.length === 0 && <Empty>该状态下没有登记</Empty>}
      </div>
    </div>
  );
}
