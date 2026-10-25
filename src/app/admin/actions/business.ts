"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { addMonths } from "@/lib/dates";
import { OFFICIAL_HOST_FEE } from "@/lib/constants";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => Number.parseInt(str(fd, k), 10) || 0;
const bool = (fd: FormData, k: string) => fd.get(k) === "on";

// ───────── 设备 ─────────

export async function saveMachine(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const data = {
    name: str(fd, "name"),
    location: str(fd, "location"),
    country: str(fd, "country") || "US",
    city: str(fd, "city") || null,
    chip: str(fd, "chip"),
    memory: int(fd, "memory"),
    storage: int(fd, "storage"),
    status: str(fd, "status") || "AVAILABLE",
    notes: str(fd, "notes") || null,
    planId: str(fd, "planId"),
    ownerId: str(fd, "ownerId") || null,
    deliveryCredential: str(fd, "deliveryCredential") || null,
  };
  const back = id ? `/admin/machines/${id}` : "/admin/machines";
  if (!data.name || !data.location || !data.planId) redirect(`${back}?error=${encodeURIComponent("名称、位置、方案为必填")}`);
  const dup = await db.machine.findUnique({ where: { name: data.name } });
  if (dup && dup.id !== id) redirect(`${back}?error=${encodeURIComponent(`名称 ${data.name} 已被使用`)}`);
  if (id) await db.machine.update({ where: { id }, data });
  else await db.machine.create({ data });
  revalidatePath("/admin", "layout");
  revalidatePath("/pricing");
  revalidatePath("/");
  redirect(back);
}

export async function setMachineStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await db.machine.update({ where: { id }, data: { status: str(fd, "status") } });
  revalidatePath("/admin", "layout");
  revalidatePath("/pricing");
}

/** 官方房东登记的机器：审核清单后上架 */
export async function approveMachine(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const m = await db.machine.findUniqueOrThrow({ where: { id } });
  if (m.status !== "ONBOARDING") redirect(`/admin/machines/${id}?error=${encodeURIComponent("只有待上架的机器可以批准")}`);
  await db.machine.update({ where: { id }, data: { status: "AVAILABLE" } });
  revalidatePath("/admin", "layout");
  revalidatePath("/pricing");
  revalidatePath("/ops");
  redirect(`/admin/machines/${id}`);
}

export async function deleteMachine(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const used = await db.order.count({ where: { machineId: id } });
  if (used) redirect(`/admin/machines?error=${encodeURIComponent("该设备有关联订单，不能删除，可改为已退役")}`);
  await db.machine.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin/machines");
}

// ───────── 方案 ─────────

export async function savePlan(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const features = str(fd, "features").split("\n").map((s) => s.trim()).filter(Boolean);
  const data = {
    slug: str(fd, "slug"),
    name: str(fd, "name"),
    badge: str(fd, "badge") || null,
    spec: str(fd, "spec"),
    priceMonth: int(fd, "priceMonth"),
    priceQuarter: int(fd, "priceQuarter"),
    priceYear: int(fd, "priceYear"),
    summary: str(fd, "summary"),
    features: JSON.stringify(features),
    responseHours: int(fd, "responseHours") || 24,
    seats: str(fd, "seats") || "1 人",
    xcodeLevel: str(fd, "xcodeLevel") || "可用",
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
    sort: int(fd, "sort"),
  };
  const fail = (m: string): never => redirect(`/admin/plans?error=${encodeURIComponent(m)}`);
  if (!data.slug || !data.name) fail("标识、名称为必填");
  if (data.priceMonth <= 0 || data.priceQuarter <= 0 || data.priceYear <= 0) fail("三个周期的月均价都必须大于 0");
  if (data.priceQuarter > data.priceMonth || data.priceYear > data.priceQuarter) fail("月均价应满足：月付 ≥ 季付 ≥ 年付");
  const dup = await db.plan.findUnique({ where: { slug: data.slug } });
  if (dup && dup.id !== id) fail("标识已存在");
  if (id) await db.plan.update({ where: { id }, data });
  else await db.plan.create({ data });
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  revalidatePath("/");
  redirect("/admin/plans");
}

// ───────── 订单 ─────────

async function releaseMachine(machineId: string | null) {
  if (machineId) {
    await db.machine.updateMany({ where: { id: machineId, status: { in: ["RESERVED", "RENTED"] } }, data: { status: "AVAILABLE" } });
  }
}

function back(id: string, error?: string): never {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/orders/${id}`);
  redirect(`/admin/orders/${id}${error ? `?error=${encodeURIComponent(error)}` : ""}`);
}

export async function assignMachine(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const machineId = str(fd, "machineId") || null;
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (["EXPIRED", "CANCELLED", "REFUNDED"].includes(order.status)) back(id, "订单已结束，不能分配设备");
  if (machineId && machineId !== order.machineId) {
    const m = await db.machine.findUniqueOrThrow({ where: { id: machineId } });
    if (m.status !== "AVAILABLE") back(id, `${m.name} 当前不是空闲状态`);
  }
  if (order.machineId && order.machineId !== machineId) await releaseMachine(order.machineId);
  if (machineId) {
    await db.machine.update({ where: { id: machineId }, data: { status: order.status === "DELIVERED" ? "RENTED" : "RESERVED" } });
  }
  await db.order.update({ where: { id }, data: { machineId } });
  back(id);
}

export async function confirmPayment(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (order.status !== "PENDING") back(id, "只有待付款订单可以确认收款");
  await db.order.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  back(id);
}

export async function startProvisioning(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (order.status !== "PAID") back(id, "只有已付款订单可以开始配机");
  await db.order.update({ where: { id }, data: { status: "PROVISIONING" } });
  back(id);
}

export async function deliverOrder(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const deliveryInfo = str(fd, "deliveryInfo");
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (!["PAID", "PROVISIONING"].includes(order.status)) back(id, "当前状态不能交付");
  if (!order.machineId) back(id, "请先分配设备");
  if (!deliveryInfo) back(id, "请填写交付的连接信息");
  const now = new Date();
  await db.order.update({
    where: { id },
    // 按自然月计算租期
    data: { status: "DELIVERED", deliveryInfo, startAt: now, endAt: addMonths(now, order.months) },
  });
  await db.machine.update({ where: { id: order.machineId! }, data: { status: "RENTED" } });
  back(id);
}

/** 到期 / 取消 / 退款：释放设备 */
export async function closeOrder(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!["EXPIRED", "CANCELLED", "REFUNDED"].includes(status)) back(id, "无效状态");
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (status === "EXPIRED" && order.status !== "DELIVERED") back(id, "只有使用中的订单可以标记到期");
  await db.order.update({
    where: { id },
    data: { status, autoRenew: false, endAt: status === "EXPIRED" ? new Date() : order.endAt },
  });
  // 续费单可能与原订单共用同一台机器：仍有其他进行中的订单时不释放
  const stillUsed = order.machineId
    ? await db.order.count({ where: { machineId: order.machineId, id: { not: id }, status: { in: ["PAID", "PROVISIONING", "DELIVERED"] } } })
    : 0;
  if (!stillUsed) await releaseMachine(order.machineId);
  back(id);
}

export async function toggleAutoRenew(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  await db.order.update({ where: { id }, data: { autoRenew: !order.autoRenew } });
  back(id);
}

export async function saveOrderNote(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await db.order.update({
    where: { id },
    data: { adminNote: str(fd, "adminNote") || null, deliveryInfo: str(fd, "deliveryInfo") || null },
  });
  back(id);
}

// ───────── 线索 / 到货通知 ─────────

export async function updateLead(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  await db.lead.update({
    where: { id: str(fd, "id") },
    data: { ...(status ? { status } : {}), note: str(fd, "note") || null },
  });
  revalidatePath("/admin", "layout");
}

export async function setRestockStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!["OPEN", "NOTIFIED", "CLOSED"].includes(status)) return;
  const ids = fd.getAll("id").map(String);
  await db.restockAlert.updateMany({ where: { id: { in: ids } }, data: { status } });
  revalidatePath("/admin", "layout");
}

// ───────── 官方房东结算 ─────────

/**
 * 生成某月结算：该房东机器上当月付款的订单实付合计为 gross，
 * 平台按“涉及机器数 × 每台每月服务费”收取 fee，net = gross − fee（不低于 0）。
 * 已打款的结算不会被覆盖。
 */
export async function generatePayouts(fd: FormData) {
  await requireAdmin();
  const month = str(fd, "month");
  if (!/^\d{4}-\d{2}$/.test(month)) redirect(`/admin/payouts?error=${encodeURIComponent("月份格式应为 YYYY-MM")}`);
  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  const hosts = await db.user.findMany({ where: { officialHost: true }, select: { id: true } });
  let made = 0;
  for (const h of hosts) {
    const orders = await db.order.findMany({
      where: {
        machine: { ownerId: h.id },
        status: { in: ["PAID", "PROVISIONING", "DELIVERED", "EXPIRED"] },
        paidAt: { gte: from, lt: to },
      },
      select: { amount: true, machineId: true },
    });
    if (orders.length === 0) continue;
    const gross = orders.reduce((s, o) => s + o.amount, 0);
    const fee = new Set(orders.map((o) => o.machineId)).size * OFFICIAL_HOST_FEE;
    const net = Math.max(0, gross - fee);
    const existing = await db.payout.findUnique({ where: { hostId_month: { hostId: h.id, month } } });
    if (existing?.status === "PAID") continue;
    await db.payout.upsert({
      where: { hostId_month: { hostId: h.id, month } },
      create: { hostId: h.id, month, gross, fee, net },
      update: { gross, fee, net },
    });
    made++;
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/payouts?month=${month}&made=${made}`);
}

export async function markPayoutPaid(fd: FormData) {
  await requireAdmin();
  await db.payout.update({ where: { id: str(fd, "id") }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/admin", "layout");
  revalidatePath("/ops");
}
