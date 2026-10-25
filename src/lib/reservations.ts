import "server-only";
import { db } from "./db";

/**
 * 释放超过 30 分钟保留期仍未付款的订单所占的机器。
 * 没有定时任务，在下单页、首页、方案页和后台读取前惰性调用。
 */
export async function releaseExpiredReservations() {
  const expired = await db.order.findMany({
    where: { status: "PENDING", reserveUntil: { lt: new Date() }, machineId: { not: null } },
    select: { id: true, machineId: true },
  });
  if (expired.length === 0) return;
  const machineIds = expired.map((o) => o.machineId!);
  await db.$transaction([
    db.machine.updateMany({ where: { id: { in: machineIds }, status: "RESERVED" }, data: { status: "AVAILABLE" } }),
    db.order.updateMany({ where: { id: { in: expired.map((o) => o.id) } }, data: { machineId: null } }),
  ]);
}
