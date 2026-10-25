import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CYCLES, ORDER_STATUS, SITE, type Cycle } from "@/lib/constants";
import { approxCny, date, dateTime, usd } from "@/lib/format";
import { Badge, CheckIcon, Notice, ShieldIcon, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Countdown } from "@/components/selfserve/Countdown";
import { cancelOrderAction, mockPayAction } from "../actions";

export const metadata = { title: "订单详情" };

const FLOW = ["PENDING", "PAID", "PROVISIONING", "DELIVERED"] as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  const order = await db.order.findUnique({ where: { id }, include: { plan: true, machine: true } });
  if (!order || order.userId !== user.id) notFound();

  const lapsed = order.status === "PENDING" && order.reserveUntil < new Date();
  const step = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  const cycle = CYCLES[order.cycle as Cycle];
  const stamps: Record<string, Date | null> = {
    PENDING: order.createdAt,
    PAID: order.paidAt,
    PROVISIONING: null,
    DELIVERED: order.startAt,
  };

  return (
    <div className="container-page py-12">
      <Link href="/orders" className="text-sm text-muted hover:text-brand">← 我的订单</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-navy">订单 <span className="font-mono text-lg">{order.no}</span></h1>
        {lapsed ? <Badge>已过期保留</Badge> : <StatusBadge map={ORDER_STATUS} value={order.status} />}
      </div>

      {/* 进度 */}
      {step >= 0 && !lapsed && (
        <ol className="card mt-6 grid grid-cols-4 p-5">
          {FLOW.map((s, i) => {
            const done = i <= step;
            return (
              <li key={s} className="relative flex flex-col items-center text-center">
                {i > 0 && <span className={`absolute top-4 right-1/2 h-0.5 w-full ${i <= step ? "bg-safe" : "bg-line"}`} />}
                <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${done ? "bg-safe text-white" : "bg-surface-2 text-muted"}`}>
                  {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`mt-2 text-xs ${done ? "text-ink" : "text-muted"}`}>{ORDER_STATUS[s].label}</span>
                <span className="text-[11px] text-muted">{stamps[s] ? dateTime(stamps[s]) : ""}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {order.status === "PENDING" && !lapsed && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div className="font-semibold">待付款</div>
                <div className="text-sm text-warn">机器保留剩余 <Countdown until={order.reserveUntil.toISOString()} /></div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface-2 p-5">
                <div className="text-sm font-medium text-ink">模拟支付</div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  当前为演示环境，点击下方按钮即视为付款成功。正式上线时这里会替换为 Stripe / 支付宝收银台。
                </p>
                <div className="mt-4 text-3xl font-semibold text-navy">{usd(order.amount)}</div>
                <div className="text-xs text-muted">{approxCny(order.amount)}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={mockPayAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <SubmitButton className="btn-safe" pendingText="支付中…">模拟支付 {usd(order.amount)}</SubmitButton>
                  </form>
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <SubmitButton className="btn-ghost" confirm="确定取消这个订单吗？">取消订单</SubmitButton>
                  </form>
                </div>
              </div>
            </div>
          )}

          {lapsed && (
            <Notice>保留时间已过，这个订单不能再付款了。机器可能已经分配给别人，请<Link className="underline" href={`/checkout?plan=${order.plan.slug}&cycle=${order.cycle}`}>重新下单</Link>。</Notice>
          )}

          {(order.status === "PAID" || order.status === "PROVISIONING") && (
            <Notice tone="info">
              付款已确认。我们正在准备机器和你的管理员账号，连接信息会在 3 个工作日内发到 <b>{order.deliveryEmail}</b>，也会显示在这个页面上。
            </Notice>
          )}

          {order.status === "DELIVERED" && (
            <div className="card p-6">
              <div className="flex items-center gap-2 font-semibold"><ShieldIcon className="h-5 w-5 text-safe" />连接信息</div>
              {order.deliveryInfo ? (
                <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 font-mono text-sm leading-6 whitespace-pre-wrap text-slate-200">{order.deliveryInfo}</pre>
              ) : (
                <p className="mt-3 text-sm text-muted">连接信息已发送到交付邮箱。</p>
              )}
              <p className="mt-3 text-xs text-muted">请妥善保管，不要发到公开群聊。连接问题见 <Link className="text-brand hover:underline" href="/guide">使用指南</Link>。</p>
            </div>
          )}

          {order.status === "CANCELLED" && <Notice tone="info">订单已取消，没有产生任何费用。</Notice>}
          {order.status === "REFUNDED" && <Notice tone="info">订单已退款，款项会原路退回。</Notice>}
          {order.status === "EXPIRED" && <Notice tone="info">租期已结束，机器已回收并整盘抹除。</Notice>}
        </div>

        <aside className="space-y-4">
          <div className="card p-6 text-sm">
            <dl className="space-y-3">
              <Row k="方案" v={`${order.plan.name}档 · ${order.plan.spec}`} />
              <Row k="付费周期" v={`${cycle?.label ?? order.cycle}（${order.months} 个月）`} />
              <Row k="机器" v={order.machine?.name ?? order.preferredName ?? "随机分配"} />
              <Row k="金额" v={usd(order.amount)} />
              <Row k="交付邮箱" v={order.deliveryEmail} />
              <Row k="下单时间" v={dateTime(order.createdAt)} />
              <Row k="开始日期" v={date(order.startAt)} />
              <Row k="到期日期" v={date(order.endAt)} />
            </dl>
          </div>
          {(order.status === "DELIVERED" || order.status === "EXPIRED") && (
            <Link href={`/checkout?plan=${order.plan.slug}&cycle=${order.cycle}`} className="btn-primary w-full">续费 / 再开一台</Link>
          )}
          <p className="text-xs text-muted">有问题？发邮件到 {SITE.email} 并附上订单号。</p>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="text-right text-ink">{v}</dd>
    </div>
  );
}
