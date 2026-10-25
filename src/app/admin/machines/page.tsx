import Link from "next/link";
import { db } from "@/lib/db";
import { CITY_NAMES, MACHINE_STATUS } from "@/lib/constants";
import { PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { deleteMachine, saveMachine, setMachineStatus } from "../actions/business";

export const metadata = { title: "设备管理" };

export default async function MachinesPage({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const { edit, error } = await searchParams;
  const [machines, plans] = await Promise.all([
    db.machine.findMany({
      include: { plan: true, orders: { where: { status: "DELIVERED" }, include: { user: true }, take: 1 }, _count: { select: { orders: true } } },
      orderBy: { name: "asc" },
    }),
    db.plan.findMany({ orderBy: { sort: "asc" } }),
  ]);
  const editing = edit ? machines.find((m) => m.id === edit) : undefined;
  const usedNames = new Set(machines.map((m) => m.name));

  return (
    <div>
      <PageHeader title="自营设备" desc={`共 ${machines.length} 台 · 空闲 ${machines.filter((m) => m.status === "AVAILABLE").length} 台`} />
      <ErrorBanner error={error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>名称</th><th>位置</th><th>配置</th><th>方案</th><th>当前租户</th><th>状态</th><th className="text-right">操作</th></tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.name}{m.notes && <div className="text-xs font-normal text-muted">{m.notes}</div>}</td>
                  <td>{m.location}</td>
                  <td className="text-muted">{m.chip} · {m.memory}GB · {m.storage}GB</td>
                  <td>{m.plan.name}</td>
                  <td className="text-muted">{m.orders[0]?.user.email ?? "—"}</td>
                  <td>
                    <form action={setMachineStatus} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={m.id} />
                      <StatusBadge map={MACHINE_STATUS} value={m.status} />
                      <select name="status" defaultValue={m.status} className="input w-auto py-1 text-xs">
                        {Object.entries(MACHINE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <SubmitButton className="btn-ghost btn-sm" pendingText="…">改</SubmitButton>
                    </form>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Link className="btn-ghost btn-sm" href={`/admin/machines?edit=${m.id}`}>编辑</Link>
                    {m._count.orders === 0 && (
                      <form action={deleteMachine} className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <SubmitButton className="btn-ghost btn-sm text-danger" confirm={`确定删除 ${m.name}？`}>删除</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={saveMachine} className="card h-fit space-y-3 p-5" key={editing?.id ?? "new"}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing ? `编辑 ${editing.name}` : "新增设备"}</h2>
            {editing && <Link href="/admin/machines" className="text-xs text-brand">取消编辑</Link>}
          </div>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className="block">
            <span className="label">名称（城市名）</span>
            <input name="name" list="city-names" className="input" required defaultValue={editing?.name} />
            <datalist id="city-names">
              {CITY_NAMES.filter((c) => !usedNames.has(c)).map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <label className="block"><span className="label">实际位置</span><input name="location" className="input" required defaultValue={editing?.location ?? "纽约 · 曼哈顿"} /></label>
          <label className="block"><span className="label">芯片</span><input name="chip" className="input" required defaultValue={editing?.chip ?? "Apple M4"} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="label">内存 GB</span><input name="memory" type="number" className="input" required defaultValue={editing?.memory ?? 16} /></label>
            <label className="block"><span className="label">硬盘 GB</span><input name="storage" type="number" className="input" required defaultValue={editing?.storage ?? 256} /></label>
          </div>
          <label className="block">
            <span className="label">所属方案</span>
            <select name="planId" className="input" defaultValue={editing?.planId ?? plans[0]?.id}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">状态</span>
            <select name="status" className="input" defaultValue={editing?.status ?? "AVAILABLE"}>
              {Object.entries(MACHINE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">备注</span><textarea name="notes" rows={2} className="input" defaultValue={editing?.notes ?? ""} /></label>
          <SubmitButton className="btn-primary w-full">{editing ? "保存修改" : "新增设备"}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
