import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CITY_NAMES, MACHINE_STATUS } from "@/lib/constants";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { Heartbeat } from "@/components/admin/Bits";
import { MachineForm } from "@/components/admin/MachineForm";
import { saveMachine, setMachineStatus } from "../actions/business";

export const metadata = { title: "设备管理" };

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; owner?: string; error?: string }>;
}) {
  const { status = "", owner = "", error } = await searchParams;
  const where: Prisma.MachineWhereInput = {
    ...(status ? { status } : {}),
    ...(owner === "self" ? { ownerId: null } : owner === "official" ? { ownerId: { not: null } } : {}),
  };
  const [machines, plans, hosts, counts] = await Promise.all([
    db.machine.findMany({
      where,
      include: {
        plan: true,
        owner: true,
        orders: { where: { status: { in: ["PAID", "PROVISIONING", "DELIVERED"] } }, include: { user: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    db.plan.findMany({ orderBy: { sort: "asc" } }),
    db.user.findMany({ where: { officialHost: true }, orderBy: { name: "asc" } }),
    db.machine.groupBy({ by: ["status"], _count: true }),
  ]);
  const usedNames = new Set((await db.machine.findMany({ select: { name: true } })).map((m) => m.name));
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const href = (o: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status && { status }), ...(owner && { owner }), ...o });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    return `/admin/machines?${sp}`;
  };

  return (
    <div>
      <PageHeader title="设备" desc="自营机器与官方房东托管的机器。官方房东登记的机器审核清单后上架。" />
      <ErrorBanner error={error} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={href({ status: "" })} className={!status ? "btn-primary btn-sm" : "btn-outline btn-sm"}>全部</Link>
        {Object.entries(MACHINE_STATUS).map(([k, v]) => (
          <Link key={k} href={href({ status: k })} className={status === k ? "btn-primary btn-sm" : "btn-outline btn-sm"}>
            {v.label} {countOf(k)}
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {[["", "全部归属"], ["self", "自营"], ["official", "官方房东"]].map(([k, label]) => (
          <Link key={k} href={href({ owner: k })} className={owner === k ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{label}</Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {machines.length === 0 ? (
          <Empty>没有符合条件的设备</Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>名称</th><th>位置</th><th>配置 / 方案</th><th>归属 / 心跳</th><th>当前订单</th><th>状态</th></tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const o = m.orders[0];
                  return (
                    <tr key={m.id}>
                      <td className="font-medium">
                        <Link href={`/admin/machines/${m.id}`} className="text-brand hover:underline">{m.name}</Link>
                        {m.notes && <div className="max-w-40 truncate text-xs font-normal text-muted">{m.notes}</div>}
                      </td>
                      <td>{m.location}</td>
                      <td className="text-muted">{m.chip} · {m.memory}G · {m.storage}G<div>{m.plan.name}档</div></td>
                      <td>
                        {m.owner ? (
                          <>
                            <Link href={`/admin/users/${m.owner.id}`} className="hover:text-brand">{m.owner.name}</Link>
                            <div><Heartbeat at={m.heartbeatAt} /></div>
                          </>
                        ) : (
                          <span className="text-muted">自营</span>
                        )}
                      </td>
                      <td className="text-muted">
                        {o ? <Link href={`/admin/orders/${o.id}`} className="hover:text-brand">{o.no}<div className="text-xs">{o.user?.email ?? o.deliveryEmail}</div></Link> : "—"}
                      </td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form action={saveMachine} className="card h-fit space-y-3 p-5">
          <h2 className="font-semibold">新增设备</h2>
          <MachineForm plans={plans} hosts={hosts} suggestions={CITY_NAMES.filter((c) => !usedNames.has(c))} />
          <SubmitButton className="btn-primary w-full">新增设备</SubmitButton>
        </form>
      </div>
    </div>
  );
}
