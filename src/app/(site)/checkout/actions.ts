"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CYCLES, cycleTotal, type Cycle } from "@/lib/constants";
import { orderNo } from "@/lib/format";

export type CheckoutState = { error?: string } | undefined;

const schema = z.object({
  plan: z.string().min(1),
  cycle: z.enum(["MONTH", "QUARTER", "YEAR"]),
  machine: z.string().optional(),
  email: z.email("交付邮箱格式不正确"),
});

export async function createOrderAction(_: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const user = await requireUser("/pricing");
  const parsed = schema.safeParse({
    plan: fd.get("plan"),
    cycle: fd.get("cycle"),
    machine: fd.get("machine") || undefined,
    email: String(fd.get("email") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { plan: slug, cycle, machine: machineName, email } = parsed.data;
  if (fd.get("agree") !== "on") return { error: "请先阅读并同意服务条款" };

  const plan = await db.plan.findUnique({ where: { slug } });
  if (!plan || !plan.active) return { error: "该方案已下线" };

  let orderId = "";
  try {
    orderId = await db.$transaction(async (tx) => {
      let machineId: string | null = null;
      if (machineName) {
        // 条件更新保证并发下同一台机器只被保留一次
        const m = await tx.machine.updateMany({
          where: { name: machineName, planId: plan.id, status: "AVAILABLE" },
          data: { status: "RESERVED" },
        });
        if (m.count === 0) throw new Error("MACHINE_TAKEN");
        machineId = (await tx.machine.findUnique({ where: { name: machineName } }))!.id;
      }
      const o = await tx.order.create({
        data: {
          no: orderNo(),
          userId: user.id,
          planId: plan.id,
          machineId,
          preferredName: machineName ?? null,
          cycle,
          months: CYCLES[cycle as Cycle].months,
          amount: cycleTotal(plan.priceMonthly, cycle as Cycle),
          deliveryEmail: email,
          reserveUntil: new Date(Date.now() + 30 * 60000),
        },
      });
      return o.id;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "MACHINE_TAKEN") return { error: "这台机器刚刚被别人保留了，请换一台或选择随机分配" };
    throw e;
  }
  redirect(`/orders/${orderId}`);
}
