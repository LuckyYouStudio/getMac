"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refresh(id: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/market", "layout");
}

/** 暂停：无法登录，发布中的方案下架 */
export async function setBanned(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  if (id === admin.id) return; // 不能暂停自己
  const banned = str(fd, "value") === "1";
  await db.user.update({ where: { id }, data: { banned } });
  if (banned) {
    await db.listing.updateMany({
      where: { hostId: id, status: { in: ["PUBLISHED", "PAUSED"] } },
      data: { status: "REMOVED", reviewNote: "账号已被暂停" },
    });
  }
  refresh(id);
}

/** 受限：可回复已有对话，不能发起咨询、发布方案或求租 */
export async function setRestricted(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  if (id === admin.id) return;
  await db.user.update({ where: { id }, data: { restricted: str(fd, "value") === "1" } });
  refresh(id);
}

export async function setRole(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const role = str(fd, "role");
  if (id === admin.id || !["USER", "ADMIN"].includes(role)) return;
  await db.user.update({ where: { id }, data: { role } });
  refresh(id);
}

export async function setOfficialHost(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const on = str(fd, "value") === "1";
  await db.user.update({ where: { id }, data: { officialHost: on, ...(on ? {} : { hostAgreedAt: null }) } });
  refresh(id);
  revalidatePath("/ops");
}
