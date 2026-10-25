"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CYCLES, RESERVE_MINUTES, cycleTotal } from "@/lib/constants";
import { orderNo } from "@/lib/format";
import { orderLink, rememberOrderToken } from "@/lib/order-access";
import { releaseExpiredReservations } from "@/lib/reservations";

export type CheckoutState = { error?: string; soldOut?: boolean } | undefined;

const schema = z.object({
  plan: z.string().min(1),
  cycle: z.enum(["MONTH", "QUARTER", "YEAR"]),
  machine: z.string().optional(),
  name: z.string().trim().min(1, "请填写称呼").max(40, "称呼最多 40 字"),
  email: z.email("交付邮箱格式不正确"),
});

class Taken extends Error {}

/**
 * 创建订单并原子地保留一台机器（指定名字或随机分配）。
 * 游客也可以下单，订单凭证写入浏览器 cookie。
 */
export async function createOrderAction(_: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse({
    plan: fd.get("plan"),
    cycle: fd.get("cycle"),
    machine: fd.get("machine") || undefined,
    name: fd.get("contactName"),
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { plan: slug, cycle, machine: wanted, name, email } = parsed.data;
  if (fd.get("agree") !== "on") return { error: "请先阅读并同意服务条款与隐私政策" };

  const user = await getCurrentUser();
  const plan = await db.plan.findUnique({ where: { slug } });
  if (!plan || !plan.active) return { error: "该方案已下线" };
  await releaseExpiredReservations();

  let order: { id: string; accessToken: string };
  try {
    order = await db.$transaction(async (tx) => {
      // 指定名字时只试这一台；随机分配时依次尝试同档的空闲机器
      const candidates = wanted
        ? [wanted]
        : (await tx.machine.findMany({ where: { planId: plan.id, status: "AVAILABLE" }, orderBy: { createdAt: "asc" }, select: { name: true } })).map((m) => m.name);
      let machineId: string | null = null;
      for (const n of candidates) {
        // 条件更新：并发时同一台机器只会被一个订单保留
        const r = await tx.machine.updateMany({ where: { name: n, planId: plan.id, status: "AVAILABLE" }, data: { status: "RESERVED" } });
        if (r.count === 1) {
          machineId = (await tx.machine.findUnique({ where: { name: n }, select: { id: true } }))!.id;
          break;
        }
      }
      if (!machineId) throw new Taken();
      return tx.order.create({
        data: {
          no: orderNo(),
          userId: user?.id ?? null,
          contactName: name,
          planId: plan.id,
          machineId,
          preferredName: wanted ?? null,
          cycle,
          months: CYCLES[cycle].months,
          amount: cycleTotal(plan, cycle),
          deliveryEmail: email,
          reserveUntil: new Date(Date.now() + RESERVE_MINUTES * 60000),
        },
        select: { id: true, accessToken: true },
      });
    });
  } catch (e) {
    if (e instanceof Taken) {
      return wanted
        ? { error: `${wanted} 刚刚被别人保留了，请换一台或选择随机分配。` }
        : { error: "这一档的空闲机器刚刚被订完了，可以登记到货通知。", soldOut: true };
    }
    throw e;
  }

  await rememberOrderToken(order.accessToken);
  redirect(user ? `/orders/${order.id}` : orderLink(order));
}
