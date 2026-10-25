"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

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
    chip: str(fd, "chip"),
    memory: int(fd, "memory"),
    storage: int(fd, "storage"),
    status: str(fd, "status") || "AVAILABLE",
    notes: str(fd, "notes") || null,
    planId: str(fd, "planId"),
  };
  if (!data.name || !data.location || !data.planId) redirect(`/admin/machines?error=${encodeURIComponent("名称、位置、方案为必填")}`);
  const dup = await db.machine.findUnique({ where: { name: data.name } });
  if (dup && dup.id !== id) redirect(`/admin/machines?error=${encodeURIComponent(`名称 ${data.name} 已被使用`)}`);
  if (id) await db.machine.update({ where: { id }, data });
  else await db.machine.create({ data });
  revalidatePath("/admin/machines");
  redirect("/admin/machines");
}

export async function setMachineStatus(fd: FormData) {
  await requireAdmin();
  await db.machine.update({ where: { id: str(fd, "id") }, data: { status: str(fd, "status") } });
  revalidatePath("/admin/machines");
}

export async function deleteMachine(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const used = await db.order.count({ where: { machineId: id } });
  if (used) redirect(`/admin/machines?error=${encodeURIComponent("该设备有关联订单，不能删除，可改为维护中")}`);
  await db.machine.delete({ where: { id } });
  revalidatePath("/admin/machines");
}

// ───────── 方案 ─────────

export async function savePlan(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const data = {
    slug: str(fd, "slug"),
    name: str(fd, "name"),
    badge: str(fd, "badge") || null,
    spec: str(fd, "spec"),
    priceMonthly: int(fd, "priceMonthly"),
    summary: str(fd, "summary"),
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
    sort: int(fd, "sort"),
  };
  if (!data.slug || !data.name || data.priceMonthly <= 0) redirect(`/admin/plans?error=${encodeURIComponent("标识、名称、月价为必填")}`);
  const dup = await db.plan.findUnique({ where: { slug: data.slug } });
  if (dup && dup.id !== id) redirect(`/admin/plans?error=${encodeURIComponent("标识已存在")}`);
  if (id) await db.plan.update({ where: { id }, data });
  else await db.plan.create({ data });
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  revalidatePath("/");
  redirect("/admin/plans");
}

// ───────── 订单 ─────────

async function releaseMachine(machineId: string | null) {
  if (machineId) await db.machine.update({ where: { id: machineId }, data: { status: "AVAILABLE" } });
}

function back(id: string, error?: string): never {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/orders/${id}`);
  redirect(`/admin/orders/${id}${error ? `?error=${encodeURIComponent(error)}` : ""}`);
}

export async function assignMachine(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const machineId = str(fd, "machineId") || null;
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  if (order.machineId && order.machineId !== machineId && order.status !== "DELIVERED") await releaseMachine(order.machineId);
  if (machineId) {
    const m = await db.machine.findUniqueOrThrow({ where: { id: machineId } });
    if (m.status !== "AVAILABLE" && m.id !== order.machineId) back(id, `${m.name} 当前不是空闲状态`);
    await db.machine.update({ where: { id: machineId }, data: { status: order.status === "DELIVERED" ? "RENTED" : "RESERVED" } });
  }
  await db.order.update({ where: { id }, data: { machineId } });
  revalidatePath("/admin/machines");
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
    data: {
      status: "DELIVERED",
      deliveryInfo,
      startAt: now,
      endAt: new Date(now.getTime() + order.months * 30 * 86400000),
    },
  });
  await db.machine.update({ where: { id: order.machineId! }, data: { status: "RENTED" } });
  revalidatePath("/admin/machines");
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
  await db.order.update({ where: { id }, data: { status, endAt: status === "EXPIRED" ? new Date() : order.endAt } });
  await releaseMachine(order.machineId);
  revalidatePath("/admin/machines");
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
