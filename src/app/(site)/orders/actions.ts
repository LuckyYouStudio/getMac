"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CYCLES, cycleTotal, isCycle } from "@/lib/constants";
import { addMonths } from "@/lib/dates";
import { date, usd } from "@/lib/format";
import { findViewableOrder, rememberOrderToken } from "@/lib/order-access";

/** 校验访问权限；凭专属链接操作时顺便把订单记到当前浏览器 */
async function viewable(fd: FormData) {
  const id = String(fd.get("id"));
  const t = String(fd.get("t") ?? "") || null;
  const order = await findViewableOrder(id, t);
  if (!order) redirect("/orders");
  if (t) await rememberOrderToken(order.accessToken);
  return order;
}

function back(order: { id: string }, fd: FormData): never {
  const t = String(fd.get("t") ?? "");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  redirect(t ? `/orders/${order.id}?t=${t}` : `/orders/${order.id}`);
}

/** 模拟支付：直接把订单置为已付款 */
export async function mockPayAction(fd: FormData) {
  const order = await viewable(fd);
  if (order.status !== "PENDING" || order.reserveUntil < new Date()) back(order, fd);

  // TODO: 接入真实支付
  // 在这里创建 Stripe Checkout Session / 支付宝预下单，跳转到支付页；
  // 由支付回调（webhook）校验签名后再把订单置为 PAID，而不是在这里直接修改。
  await db.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
  back(order, fd);
}

export async function cancelOrderAction(fd: FormData) {
  const order = await viewable(fd);
  if (order.status === "PENDING") {
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      if (order.machineId) {
        await tx.machine.updateMany({ where: { id: order.machineId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
      }
    });
  }
  back(order, fd);
}

/** 交付前申请退款：已付款、配机中的订单直接全额退款并释放机器 */
export async function refundBeforeDeliveryAction(fd: FormData) {
  const order = await viewable(fd);
  if (order.status === "PAID" || order.status === "PROVISIONING") {
    // TODO: 接入真实支付后，在这里调用支付渠道的退款接口
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED", autoRenew: false } });
      if (order.machineId) {
        await tx.machine.updateMany({ where: { id: order.machineId, status: { in: ["RESERVED", "RENTED"] } }, data: { status: "AVAILABLE" } });
      }
    });
  }
  back(order, fd);
}

export async function toggleAutoRenewAction(fd: FormData) {
  const order = await viewable(fd);
  if (["PENDING", "PAID", "PROVISIONING", "DELIVERED"].includes(order.status)) {
    await db.order.update({ where: { id: order.id }, data: { autoRenew: !order.autoRenew } });
  }
  back(order, fd);
}

/**
 * 续费：在原订单上延长同一台机器的租期（按自然月），金额累加到订单上。
 * 续费记录追加到订单备注，方便后台核对。
 */
export async function renewAction(fd: FormData) {
  const order = await viewable(fd);
  const cycle = String(fd.get("cycle"));
  if (order.status !== "DELIVERED" || !order.endAt || !isCycle(cycle)) back(order, fd);
  const c = CYCLES[cycle as keyof typeof CYCLES];
  const total = cycleTotal(order.plan, cycle as keyof typeof CYCLES);
  const base = order.endAt! > new Date() ? order.endAt! : new Date();
  const endAt = addMonths(base, c.months);

  // TODO: 接入真实支付
  // 与首次付款相同：先创建支付会话，支付回调成功后再执行下面的延期。
  const log = `[${date(new Date())}] 续费${c.label} ${usd(total)}，到期日 ${date(order.endAt)} → ${date(endAt)}`;
  await db.order.update({
    where: { id: order.id },
    data: {
      endAt,
      cycle,
      months: order.months + c.months,
      amount: order.amount + total,
      adminNote: order.adminNote ? `${order.adminNote}\n${log}` : log,
    },
  });
  back(order, fd);
}
