import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { findViewableOrder, orderLink } from "@/lib/order-access";
import { CYCLES, ORDER_STATUS, REFUND_WINDOW_HOURS, SITE, cycleTotal, type Cycle } from "@/lib/constants";
import { approxCny, date, dateTime, usd } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { Badge, CheckIcon, Notice, ShieldIcon, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/site/CopyButton";
import { Countdown } from "@/components/selfserve/Countdown";
import { cancelOrderAction, mockPayAction, refundBeforeDeliveryAction, renewAction, toggleAutoRenewAction } from "../actions";

export const metadata = { title: "订单详情" };
export const dynamic = "force-dynamic";

const FLOW = ["PENDING", "PAID", "PROVISIONING", "DELIVERED"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  const order = await findViewableOrder(id, t);
  if (!order) notFound();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const privateLink = `${origin}${orderLink(order)}`;
  const now = new Date();
  const lapsed = order.status === "PENDING" && order.reserveUntil < now;
  const step = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  const cycle = CYCLES[order.cycle as Cycle];
  const daysLeft = order.endAt ? daysBetween(now, order.endAt) : null;
  const stamps: Record<string, Date | null> = {
    PENDING: order.createdAt,
    PAID: order.paidAt,
    PROVISIONING: null,
    DELIVERED: order.startAt,
  };
  // 所有表单都带上 id 和专属链接 token
  const Hidden = () => (
    <>
      <input type="hidden" name="id" value={order.id} />
      {t && <input type="hidden" name="t" value={t} />}
    </>
  );
  const active = ["PENDING", "PAID", "PROVISIONING", "DELIVERED"].includes(order.status);

  return (
    <div className="container-page py-12">
      <Link href="/orders" className="text-sm text-muted hover:text-brand">← 我的订单</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-navy">订单 <span className="font-mono text-lg">{order.no}</span></h1>
        {lapsed ? <Badge>保留已过期</Badge> : <StatusBadge map={ORDER_STATUS} value={order.status} />}
      </div>

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
                <span className="hidden text-[11px] text-muted sm:block">{stamps[s] ? dateTime(stamps[s]) : ""}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {order.status === "PENDING" && !lapsed && (
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">待付款</div>
                <div className="text-sm text-warn">{order.machine?.name} 为你保留，剩余 <Countdown until={order.reserveUntil.toISOString()} /></div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface-2 p-5">
                <div className="text-sm font-medium text-ink">模拟支付</div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  当前为演示环境，点击下方按钮即视为付款成功。正式上线后这里会跳转到 Stripe 收银台（银行卡 / 支付宝），账单商家名为 {SITE.billingDescriptor}。
                </p>
                <div className="mt-4 text-3xl font-semibold text-navy">{usd(order.amount)}</div>
                <div className="text-xs text-muted">{approxCny(order.amount)}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={mockPayAction}>
                    <Hidden />
                    <SubmitButton className="btn-safe" pendingText="支付中…">模拟支付 {usd(order.amount)}</SubmitButton>
                  </form>
                  <form action={cancelOrderAction}>
                    <Hidden />
                    <SubmitButton className="btn-ghost" confirm="确定取消这个订单吗？保留的机器会立即释放。">取消订单</SubmitButton>
                  </form>
                </div>
              </div>
            </div>
          )}

          {lapsed && (
            <Notice>
              保留时间已过，这个订单不能再付款，机器已释放给其他人。请
              <Link className="underline" href={`/checkout?plan=${order.plan.slug}&cycle=${order.cycle}`}>重新下单</Link>。
            </Notice>
          )}

          {(order.status === "PAID" || order.status === "PROVISIONING") && (
            <div className="space-y-3">
              <Notice tone="info">
                付款已确认。我们正在准备 {order.machine?.name ?? "机器"} 和你的管理员账号，连接信息会在 3 个工作日内发到 <b>{order.deliveryEmail}</b>，也会显示在这个页面。
              </Notice>
              <form action={refundBeforeDeliveryAction} className="text-right">
                <Hidden />
                <SubmitButton className="btn-ghost btn-sm" confirm="交付前取消会全额退款，机器会释放给其他人。确定吗？">不需要了？交付前取消并全额退款</SubmitButton>
              </form>
            </div>
          )}

          {order.status === "DELIVERED" && (
            <div className="card p-6">
              <div className="flex items-center gap-2 font-semibold"><ShieldIcon className="h-5 w-5 text-safe" />连接信息</div>
              {order.deliveryInfo ? (
                <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 font-mono text-sm leading-6 whitespace-pre-wrap text-slate-200">{order.deliveryInfo}</pre>
              ) : (
                <p className="mt-3 text-sm text-muted">连接信息已发送到交付邮箱。</p>
              )}
              <ul className="mt-4 space-y-1.5 rounded-xl bg-warn-soft p-4 text-xs leading-5 text-warn">
                <li>· 这里是设备的连接信息，不是任何第三方账号。首次登录后请立即修改临时密码。</li>
                <li>· 不要把交付邮件或本页截图转发到群聊、工单或公开渠道；需要给同事用，请在机器上为他单独建账号。</li>
                <li>· 我们只在服务器上保存连接信息用于交付和售后，不会通过邮件以外的渠道主动向你索要密码。</li>
              </ul>
              <p className="mt-3 text-sm text-muted">
                第一次连接？看 <Link className="text-brand hover:underline" href="/setup">设置手册</Link>。交付后 {REFUND_WINDOW_HOURS} 小时内因我们的原因无法使用，可全额退款。
              </p>
            </div>
          )}

          {order.status === "DELIVERED" && order.endAt && (
            <div className="card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-semibold">续费</div>
                <div className="text-sm text-muted">
                  到期日 {date(order.endAt)}{daysLeft !== null && daysLeft >= 0 ? `（还剩 ${daysLeft} 天）` : ""}
                </div>
              </div>
              {daysLeft !== null && daysLeft <= 7 && (
                <div className="mt-3">
                  {order.autoRenew ? (
                    <Notice tone="info">还有 {Math.max(daysLeft, 0)} 天到期，到期日会按{cycle?.label}自动续费。演示环境未接入扣款，请手动续费。</Notice>
                  ) : (
                    <Notice>还有 {Math.max(daysLeft, 0)} 天到期，自动续费已关闭。需要继续用的话请在到期前续费，否则到期后机器会回收并整盘抹除。</Notice>
                  )}
                </div>
              )}
              <form action={renewAction} className="mt-4 space-y-3">
                <Hidden />
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(CYCLES) as Cycle[]).map((k) => (
                    <label key={k} className="flex cursor-pointer flex-col rounded-xl border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <input type="radio" name="cycle" value={k} defaultChecked={k === order.cycle} className="accent-brand" />
                        {CYCLES[k].label}
                      </span>
                      <span className="mt-1 text-xs text-muted">{usd(cycleTotal(order.plan, k))} · 延长 {CYCLES[k].months} 个月</span>
                    </label>
                  ))}
                </div>
                <SubmitButton className="btn-safe" pendingText="续费中…">模拟支付并续费</SubmitButton>
                <p className="text-xs text-muted">续上的是同一台机器 {order.machine?.name}，数据和账号都不变，新到期日按自然月顺延。</p>
              </form>
            </div>
          )}

          {order.status === "CANCELLED" && <Notice tone="info">订单已取消，没有产生任何费用。</Notice>}
          {order.status === "REFUNDED" && <Notice tone="info">订单已退款，款项会原路退回，银行处理一般需要 5–10 个工作日。</Notice>}
          {order.status === "EXPIRED" && (
            <Notice tone="info">
              租期已结束，机器已回收并整盘抹除。想继续用？<Link className="underline" href={`/pricing?cycle=${order.cycle}#plans`}>重新开通一台</Link>。
            </Notice>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-6 text-sm">
            <dl className="space-y-3">
              <Row k="方案" v={`${order.plan.name}档 · ${order.plan.spec}`} />
              <Row k="付费周期" v={`${cycle?.label ?? order.cycle}（累计 ${order.months} 个月）`} />
              <Row k="机器" v={order.machine ? `${order.machine.name} · ${order.machine.location}` : "—"} />
              <Row k="累计金额" v={usd(order.amount)} />
              <Row k="称呼" v={order.contactName ?? "—"} />
              <Row k="交付邮箱" v={order.deliveryEmail} />
              <Row k="下单时间" v={dateTime(order.createdAt)} />
              <Row k="开始日期" v={date(order.startAt)} />
              <Row k="到期日期" v={date(order.endAt)} />
            </dl>
          </div>

          {active && (
            <div className="card p-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">自动续费</div>
                  <div className="text-xs text-muted">{order.autoRenew ? `已开启，到期按${cycle?.label}续上同一台机器` : "已关闭，到期即停"}</div>
                </div>
                <form action={toggleAutoRenewAction}>
                  <Hidden />
                  <SubmitButton className={order.autoRenew ? "btn-outline btn-sm" : "btn-safe btn-sm"} pendingText="…">
                    {order.autoRenew ? "关闭" : "开启"}
                  </SubmitButton>
                </form>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                演示环境未接入真实扣款：自动续费会在接入支付后生效，到期前 7 天会在本页提示。详见 <Link className="text-brand hover:underline" href="/terms#renewal">自动续费条款</Link>。
              </p>
            </div>
          )}

          <div className="card space-y-3 p-5 text-sm">
            <div className="font-medium">订单专属链接</div>
            <p className="text-xs leading-5 text-muted">换设备或清除浏览器数据后，用这个链接打开订单。只发给需要的人。</p>
            <CopyButton text={privateLink} label="复制专属链接" className="btn-outline btn-sm w-full" />
          </div>

          <div className="card space-y-2 p-5 text-sm">
            {order.paidAt ? (
              <div className="flex items-center justify-between">
                <span>付款收据</span>
                <span className="text-xs text-muted">接入 Stripe 后在此下载</span>
              </div>
            ) : null}
            {order.status === "DELIVERED" && (
              <div className="flex items-center justify-between">
                <span>升级到更高一档</span>
                <Link className="text-xs text-brand hover:underline" href={`/apply?plan=upgrade&order=${order.no}`}>差价按剩余天数 →</Link>
              </div>
            )}
            <p className="text-xs text-muted">有问题？发邮件到 {SITE.email} 并附上订单号。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 text-right break-words text-ink">{v}</dd>
    </div>
  );
}
