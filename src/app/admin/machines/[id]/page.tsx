import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CYCLES, MACHINE_STATUS, ORDER_STATUS, type Cycle } from "@/lib/constants";
import { dateTime, usd } from "@/lib/format";
import { parseJson } from "@/lib/json";
import { Badge, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { Heartbeat, Info } from "@/components/admin/Bits";
import { MachineForm } from "@/components/admin/MachineForm";
import { CHECKLIST } from "@/components/official/checklist";
import { approveMachine, deleteMachine, saveMachine } from "../../actions/business";

export const metadata = { title: "设备详情" };


export default async function MachineDetail({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const m = await db.machine.findUnique({
    where: { id },
    include: { plan: true, owner: true, orders: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!m) notFound();
  const [plans, hosts] = await Promise.all([
    db.plan.findMany({ orderBy: { sort: "asc" } }),
    db.user.findMany({ where: { officialHost: true }, orderBy: { name: "asc" } }),
  ]);
  // 与房东后台共用同一份清单定义；“收到首次心跳”按 heartbeatAt 自动判断
  const checklist: Record<string, boolean> = { ...parseJson<Record<string, boolean>>(m.checklist, {}), heartbeat: !!m.heartbeatAt };
  const submitted = !!checklist.submitted;
  const done = CHECKLIST.filter((c) => checklist[c.key]).length;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/machines" className="text-sm text-brand hover:underline">← 设备列表</Link>
      <PageHeader
        title={m.name}
        desc={<span className="flex flex-wrap items-center gap-2"><StatusBadge map={MACHINE_STATUS} value={m.status} /> {m.location} · {m.chip} {m.memory}G / {m.storage}G · {m.plan.name}档</span>}
      />
      <ErrorBanner error={error} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {m.owner && (
            <div className="card space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">官方房东托管</h2>
                <Heartbeat at={m.heartbeatAt} />
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info k="房东" v={<Link href={`/admin/users/${m.owner.id}`} className="text-brand hover:underline">{m.owner.name}</Link>} />
                <Info k="房东邮箱" v={m.owner.email} />
                <Info k="最近心跳" v={dateTime(m.heartbeatAt)} />
                <Info k="心跳令牌" v={m.heartbeatToken ? <code className="text-xs">{m.heartbeatToken.slice(0, 8)}…</code> : "—"} />
              </div>
              <div>
                <div className="mb-1.5 text-sm font-medium">
                  上架清单 <span className="text-muted">{done} / {CHECKLIST.length}</span>
                  {submitted && <span className="ml-2"><Badge tone="warn">房东已提交上架审核</Badge></span>}
                </div>
                <ul className="space-y-1 text-sm">
                  {CHECKLIST.map((c) => (
                    <li key={c.key} className="flex items-center gap-2">
                      <span className={checklist[c.key] ? "text-safe" : "text-muted"}>{checklist[c.key] ? "✓" : "○"}</span>
                      <span className={checklist[c.key] ? "" : "text-muted"}>{c.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">交付凭据</div>
                <pre className="rounded-lg bg-surface-2 p-3 font-mono text-xs whitespace-pre-wrap">{m.deliveryCredential || "房东尚未填写"}</pre>
              </div>
              {m.status === "ONBOARDING" && (
                <form action={approveMachine} className="flex items-center gap-3">
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton className="btn-safe" confirm={done < CHECKLIST.length ? "清单还有未完成项，仍要上架？" : "确认上架？上架后可被下单。"}>批准上架</SubmitButton>
                  {done < CHECKLIST.length && <span className="text-xs text-warn">还有 {CHECKLIST.length - done} 项未完成</span>}
                </form>
              )}
            </div>
          )}

          <div className="card overflow-x-auto">
            <h2 className="px-5 pt-4 font-semibold">订单记录</h2>
            {m.orders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">暂无订单</p>
            ) : (
              <table className="table mt-2">
                <thead><tr><th>订单号</th><th>下单人</th><th>周期</th><th>金额</th><th>状态</th><th>租期</th></tr></thead>
                <tbody>
                  {m.orders.map((o) => (
                    <tr key={o.id}>
                      <td><Link className="font-mono text-brand hover:underline" href={`/admin/orders/${o.id}`}>{o.no}</Link></td>
                      <td>{o.user?.email ?? `${o.deliveryEmail}（游客）`}</td>
                      <td>{CYCLES[o.cycle as Cycle]?.label ?? o.cycle}</td>
                      <td>{usd(o.amount)}</td>
                      <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                      <td className="text-xs text-muted">{dateTime(o.startAt)} → {dateTime(o.endAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <form action={saveMachine} className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">编辑</h2>
              {m.owner ? <Badge tone="info">官方房东</Badge> : <Badge>自营</Badge>}
            </div>
            <MachineForm m={m} plans={plans} hosts={hosts} />
            <SubmitButton className="btn-primary w-full">保存修改</SubmitButton>
          </form>
          {m.orders.length === 0 && (
            <form action={deleteMachine} className="card p-5">
              <input type="hidden" name="id" value={m.id} />
              <SubmitButton className="btn-danger w-full" confirm={`确定删除 ${m.name}？此操作不可撤销。`}>删除设备</SubmitButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
