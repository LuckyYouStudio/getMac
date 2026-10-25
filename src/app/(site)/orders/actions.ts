"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

async function ownPendingOrder(id: string) {
  const user = await requireUser(`/orders/${id}`);
  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) redirect("/orders");
  return order;
}

/** 模拟支付：直接把订单置为已付款 */
export async function mockPayAction(fd: FormData) {
  const id = String(fd.get("id"));
  const order = await ownPendingOrder(id);
  if (order.status !== "PENDING" || order.reserveUntil < new Date()) {
    redirect(`/orders/${id}`);
  }

  // TODO: 接入真实支付
  // 在这里创建 Stripe Checkout Session / 支付宝预下单，跳转到支付页；
  // 由支付回调（webhook）校验签名后再把订单置为 PAID，而不是在这里直接修改。
  await db.order.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
}

export async function cancelOrderAction(fd: FormData) {
  const id = String(fd.get("id"));
  const order = await ownPendingOrder(id);
  if (order.status !== "PENDING") redirect(`/orders/${id}`);
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
    if (order.machineId) {
      await tx.machine.updateMany({ where: { id: order.machineId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    }
  });
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
}
