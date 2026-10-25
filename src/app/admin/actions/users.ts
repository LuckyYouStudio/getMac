"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refresh(id: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/users/${id}`);
}

export async function setBanned(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  if (id === admin.id) return; // 不能封禁自己
  const banned = str(fd, "banned") === "1";
  await db.user.update({ where: { id }, data: { banned } });
  // 封禁时下架其发布中的方案
  if (banned) await db.listing.updateMany({ where: { hostId: id, status: "PUBLISHED" }, data: { status: "OFFLINE" } });
  refresh(id);
  revalidatePath("/market", "layout");
}

export async function setRole(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const role = str(fd, "role");
  if (id === admin.id || !["USER", "ADMIN"].includes(role)) return;
  await db.user.update({ where: { id }, data: { role } });
  refresh(id);
}

export async function reviewHost(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "hostStatus");
  if (!["VERIFIED", "REJECTED", "NONE"].includes(status)) return;
  await db.user.update({ where: { id }, data: { hostStatus: status } });
  refresh(id);
  revalidatePath("/market", "layout");
}
