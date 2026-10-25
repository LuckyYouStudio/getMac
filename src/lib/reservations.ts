import "server-only";
import { db } from "./db";

/**
 * 释放超过 30 分钟保留期仍未付款的订单所占的机器。
 * 没有定时任务，在下单页、首页、方案页和后台读取前惰性调用。
 * 订单上的 machineId 保留，方便后台查看当时保留的是哪台。
 */
export async function releaseExpiredReservations() {
  const expired = await db.order.findMany({
    where: { status: "PENDING", reserveUntil: { lt: new Date() }, machineId: { not: null } },
    select: { machineId: true },
  });
  if (expired.length === 0) return;
  const machineIds = expired.map((o) => o.machineId!);
  // 只释放仍处于“已保留”的机器；若机器已被付款订单或新的未过期订单占用则不动
  const held = await db.order.findMany({
    where: {
      machineId: { in: machineIds },
      OR: [
        { status: { in: ["PAID", "PROVISIONING", "DELIVERED"] } },
        { status: "PENDING", reserveUntil: { gte: new Date() } },
      ],
    },
    select: { machineId: true },
  });
  const busy = new Set(held.map((o) => o.machineId));
  const free = machineIds.filter((id) => !busy.has(id));
  if (free.length === 0) return;
  await db.machine.updateMany({ where: { id: { in: free }, status: "RESERVED" }, data: { status: "AVAILABLE" } });
}

/** 各方案当前空闲机器数（不含待上架、退役） */
export async function availableByPlan() {
  const rows = await db.machine.groupBy({ by: ["planId"], where: { status: "AVAILABLE" }, _count: true });
  return new Map(rows.map((r) => [r.planId, r._count]));
}
