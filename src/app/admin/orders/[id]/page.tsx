import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CYCLES, MACHINE_STATUS, ORDER_STATUS, type Cycle } from "@/lib/constants";
import { dateTime, usd } from "@/lib/format";
import { Badge, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { Info } from "@/components/admin/Bits";
import {
  assignMachine, closeOrder, confirmPayment, deliverOrder, saveOrderNote, startProvisioning, toggleAutoRenew,
} from "../../actions/business";

export const metadata = { title: "订单详情" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const order = await db.order.findUnique({ where: { id }, include: { user: true, plan: true, machine: { include: { owner: true } } } });
  if (!order) notFound();
  const [machines, renewals, renewedFrom] = await Promise.all([
    db.machine.findMany({
      where: { OR: [{ status: "AVAILABLE" }, { id: order.machineId ?? "" }] },
      include: { plan: true },
      orderBy: { name: "asc" },
    }),
    db.order.findMany({ where: { renewedFromId: order.id }, orderBy: { createdAt: "asc" } }),
    order.renewedFromId ? db.order.findUnique({ where: { id: order.renewedFromId } }) : null,
  ]);
  const open = ["PAID", "PROVISIONING"].includes(order.status);
  const ended = ["EXPIRED", "CANCELLED", "REFUNDED"].includes(order.status);
  const reserveExpired = order.status === "PENDING" && order.reserveUntil < new Date();
  const Hidden = () => <input type="hidden" name="id" value={order.id} />;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/orders" className="text-sm text-brand hover:underline">← 订单列表</Link>
      <PageHeader
        title={`订单 ${order.no}`}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            当前状态 <StatusBadge map={ORDER_STATUS} value={order.status} />
            {reserveExpired && <Badge tone="danger">保留已过期</Badge>}
            {!order.userId && <Badge>游客订单</Badge>}
          </span>
        }
      />
      <ErrorBanner error={error} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="card grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
            <Info k="方案" v={`${order.plan.name} · ${order.plan.spec}`} />
            <Info k="付费周期" v={`${CYCLES[order.cycle as Cycle]?.label ?? order.cycle} · ${order.months} 个月`} />
            <Info k="金额" v={usd(order.amount)} />
            <Info k="想要的机器名" v={order.preferredName ?? "—"} />
            <Info k="联系人" v={order.contactName ?? order.user?.name ?? "—"} />
            <Info k="交付邮箱" v={order.deliveryEmail} />
            <Info k="下单时间" v={dateTime(order.createdAt)} />
            <Info k="保留至" v={dateTime(order.reserveUntil)} />
            <Info k="付款时间" v={dateTime(order.paidAt)} />
            <Info k="开始" v={dateTime(order.startAt)} />
            <Info k="到期" v={dateTime(order.endAt)} />
            <Info
              k="自动续费"
              v={
                <form action={toggleAutoRenew} className="flex items-center gap-2">
                  <Hidden />
                  {order.autoRenew ? <Badge tone="ok">已开启</Badge> : <Badge>已关闭</Badge>}
                  {!ended && <SubmitButton className="btn-ghost btn-sm">{order.autoRenew ? "关闭" : "开启"}</SubmitButton>}
                </form>
              }
            />
            {renewedFrom && (
              <Info k="续费自" v={<Link href={`/admin/orders/${renewedFrom.id}`} className="font-mono text-brand hover:underline">{renewedFrom.no}</Link>} />
            )}
            {renewals.length > 0 && (
              <Info
                k="续费单"
                v={renewals.map((r) => (
                  <Link key={r.id} href={`/admin/orders/${r.id}`} className="mr-2 font-mono text-brand hover:underline">{r.no}</Link>
                ))}
              />
            )}
          </div>

          <form action={saveOrderNote} className="card space-y-3 p-5">
            <Hidden />
            <h2 className="font-semibold">交付信息与备注</h2>
            <label className="block">
              <span className="label">连接信息（用户在订单页可见）</span>
              <textarea name="deliveryInfo" rows={4} className="input font-mono" defaultValue={order.deliveryInfo ?? ""} placeholder={"UU 远程设备码：\n临时密码：\n机器所在城市："} />
            </label>
            {order.machine?.deliveryCredential && (
              <p className="rounded-lg bg-surface-2 p-3 text-xs">
                <span className="font-medium">房东提供的交付凭据：</span>
                <span className="font-mono whitespace-pre-wrap">{order.machine.deliveryCredential}</span>
              </p>
            )}
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
                <p className="text-xs text-muted">交付会把设备标为出租中，并从现在起按自然月计算 {order.months} 个月租期。</p>
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
            {ended && <p className="text-sm text-muted">订单已结束，无可用操作。</p>}
          </div>

          <form action={assignMachine} className="card space-y-3 p-5">
            <Hidden />
            <h2 className="font-semibold">分配设备</h2>
            {order.machine && (
              <p className="flex flex-wrap items-center gap-2 text-sm">
                当前：<Link href={`/admin/machines/${order.machine.id}`} className="font-semibold text-brand hover:underline">{order.machine.name}</Link>
                <StatusBadge map={MACHINE_STATUS} value={order.machine.status} />
                {order.machine.owner && <Badge tone="info">官方房东 · {order.machine.owner.name}</Badge>}
              </p>
            )}
            <select name="machineId" className="input" defaultValue={order.machineId ?? ""} disabled={ended}>
              <option value="">不分配</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.chip} {m.memory}G · {m.plan.name}{m.planId !== order.planId ? "（非本档）" : ""}{m.name === order.preferredName ? " ★用户想要" : ""}
                </option>
              ))}
            </select>
            {!ended && <SubmitButton className="btn-outline w-full">保存分配</SubmitButton>}
          </form>

          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-semibold">下单人</h2>
            {order.user ? (
              <>
                <p>
                  {order.user.name}{" "}
                  {order.user.banned && <Badge tone="danger">已暂停</Badge>}
                  {order.user.restricted && <Badge tone="warn">受限</Badge>}
                </p>
                <p className="text-muted">{order.user.email}</p>
                {order.user.wechat && <p className="text-muted">微信 {order.user.wechat}</p>}
                <Link href={`/admin/users/${order.user.id}`} className="mt-2 inline-block text-brand hover:underline">查看用户 →</Link>
              </>
            ) : (
              <>
                <p>{order.contactName || "游客"} <Badge>游客</Badge></p>
                <p className="text-muted">{order.deliveryEmail}</p>
                <p className="mt-1 text-xs text-muted">游客订单凭浏览器 cookie 和专属链接访问，没有注册账号。</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
