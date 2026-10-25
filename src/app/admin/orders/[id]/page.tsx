import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CYCLES, HOST_STATUS, MACHINE_STATUS, ORDER_STATUS, type Cycle } from "@/lib/constants";
import { dateTime, usd } from "@/lib/format";
import { Badge, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { assignMachine, closeOrder, confirmPayment, deliverOrder, saveOrderNote, startProvisioning } from "../../actions/business";

export const metadata = { title: "订单详情" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const order = await db.order.findUnique({ where: { id }, include: { user: true, plan: true, machine: true } });
  if (!order) notFound();
  const machines = await db.machine.findMany({
    where: { OR: [{ status: "AVAILABLE" }, { id: order.machineId ?? "" }] },
    include: { plan: true },
    orderBy: { name: "asc" },
  });
  const open = ["PAID", "PROVISIONING"].includes(order.status);
  const Hidden = () => <input type="hidden" name="id" value={order.id} />;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/orders" className="text-sm text-brand hover:underline">← 订单列表</Link>
      <PageHeader title={`订单 ${order.no}`} desc={<span className="flex items-center gap-2">当前状态 <StatusBadge map={ORDER_STATUS} value={order.status} /></span>} />
      <ErrorBanner error={error} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="card grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
            <Info k="方案" v={`${order.plan.name} · ${order.plan.spec}`} />
            <Info k="付费周期" v={`${CYCLES[order.cycle as Cycle]?.label ?? order.cycle} · ${order.months} 个月`} />
            <Info k="金额" v={usd(order.amount)} />
            <Info k="想要的机器名" v={order.preferredName ?? "—"} />
            <Info k="交付邮箱" v={order.deliveryEmail} />
            <Info k="下单时间" v={dateTime(order.createdAt)} />
            <Info k="保留至" v={dateTime(order.reserveUntil)} />
            <Info k="付款时间" v={dateTime(order.paidAt)} />
            <Info k="开始" v={dateTime(order.startAt)} />
            <Info k="到期" v={dateTime(order.endAt)} />
          </div>

          <form action={saveOrderNote} className="card space-y-3 p-5">
            <Hidden />
            <h2 className="font-semibold">交付信息与备注</h2>
            <label className="block">
              <span className="label">连接信息（用户在订单页可见）</span>
              <textarea name="deliveryInfo" rows={4} className="input font-mono" defaultValue={order.deliveryInfo ?? ""} placeholder={"UU 远程设备码：\n临时密码：\n机器所在城市："} />
            </label>
            <label className="block">
              <span className="label">内部备注（仅后台可见）</span>
              <textarea name="adminNote" rows={2} className="input" defaultValue={order.adminNote ?? ""} />
            </label>
            <SubmitButton className="btn-outline">保存</SubmitButton>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card space-y-3 p-5">
            <h2 className="font-semibold">流转操作</h2>
            {order.status === "PENDING" && (
              <form action={confirmPayment}><Hidden /><SubmitButton className="btn-safe w-full" confirm="确认已收到这笔款项？">确认收款（模拟）</SubmitButton></form>
            )}
            {order.status === "PAID" && (
              <form action={startProvisioning}><Hidden /><SubmitButton className="btn-primary w-full">开始配机</SubmitButton></form>
            )}
            {open && (
              <form action={deliverOrder} className="space-y-2 rounded-lg bg-surface-2 p-3">
                <Hidden />
                <p className="text-xs text-muted">交付会将设备标为出租中，并从现在起计算租期。</p>
                <textarea name="deliveryInfo" rows={3} required className="input font-mono text-xs" defaultValue={order.deliveryInfo ?? ""} placeholder="填写连接信息" />
                <SubmitButton className="btn-safe w-full" confirm="确认已完成交付？">确认交付</SubmitButton>
              </form>
            )}
            {order.status === "DELIVERED" && (
              <form action={closeOrder}><Hidden /><input type="hidden" name="status" value="EXPIRED" /><SubmitButton className="btn-outline w-full" confirm="标记到期并释放设备？">标记到期并回收</SubmitButton></form>
            )}
            {["PENDING", "PAID", "PROVISIONING"].includes(order.status) && (
              <form action={closeOrder}><Hidden /><input type="hidden" name="status" value="CANCELLED" /><SubmitButton className="btn-danger w-full" confirm="取消该订单？">取消订单</SubmitButton></form>
            )}
            {["PAID", "PROVISIONING", "DELIVERED"].includes(order.status) && (
              <form action={closeOrder}><Hidden /><input type="hidden" name="status" value="REFUNDED" /><SubmitButton className="btn-danger w-full" confirm="确认已退款？设备会被释放。">标记已退款</SubmitButton></form>
            )}
            {["EXPIRED", "CANCELLED", "REFUNDED"].includes(order.status) && <p className="text-sm text-muted">订单已结束，无可用操作。</p>}
          </div>

          <form action={assignMachine} className="card space-y-3 p-5">
            <Hidden />
            <h2 className="font-semibold">分配设备</h2>
            {order.machine && (
              <p className="flex items-center gap-2 text-sm">
                当前：<b>{order.machine.name}</b> <StatusBadge map={MACHINE_STATUS} value={order.machine.status} />
              </p>
            )}
            <select name="machineId" className="input" defaultValue={order.machineId ?? ""} disabled={["EXPIRED", "CANCELLED", "REFUNDED"].includes(order.status)}>
              <option value="">不分配</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.chip} {m.memory}G · {m.plan.name}{m.planId !== order.planId ? "（非本档）" : ""}{m.name === order.preferredName ? " ★用户想要" : ""}
                </option>
              ))}
            </select>
            <SubmitButton className="btn-outline w-full">保存分配</SubmitButton>
          </form>

          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-semibold">用户</h2>
            <p>{order.user.name} <StatusBadge map={HOST_STATUS} value={order.user.hostStatus} /></p>
            <p className="text-muted">{order.user.email}</p>
            {order.user.wechat && <p className="text-muted">微信 {order.user.wechat}</p>}
            {order.user.banned && <Badge tone="danger">已封禁</Badge>}
            <Link href={`/admin/users/${order.user.id}`} className="mt-2 inline-block text-brand hover:underline">查看用户 →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{k}</div>
      <div className="mt-0.5">{v}</div>
    </div>
  );
}
