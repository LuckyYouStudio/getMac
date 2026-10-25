"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refreshMarket() {
  revalidatePath("/admin", "layout");
  revalidatePath("/market", "layout");
}

// ───────── 出租方案审核 ─────────

export async function reviewListing(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const decision = str(fd, "decision"); // approve | reject | offline | restore
  const reason = str(fd, "reason");
  const map: Record<string, { status: string; rejectReason?: string | null }> = {
    approve: { status: "PUBLISHED", rejectReason: null },
    reject: { status: "REJECTED", rejectReason: reason || "方案信息不符合市场规则" },
    offline: { status: "OFFLINE" },
    restore: { status: "PUBLISHED" },
  };
  const data = map[decision];
  if (!data) return;
  await db.listing.update({ where: { id }, data });
  refreshMarket();
  revalidatePath(`/market/${id}`);
}

// ───────── 求租帖 ─────────

export async function setWantedStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!["OPEN", "CLOSED", "HIDDEN"].includes(status)) return;
  await db.wantedPost.update({ where: { id: str(fd, "id") }, data: { status } });
  refreshMarket();
}

// ───────── 交流区 ─────────

export async function togglePost(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const field = str(fd, "field");
  if (field !== "hidden" && field !== "pinned") return;
  const post = await db.communityPost.findUniqueOrThrow({ where: { id } });
  await db.communityPost.update({ where: { id }, data: { [field]: !post[field] } });
  refreshMarket();
  revalidatePath(`/market/community/${id}`);
}

export async function toggleReply(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const reply = await db.communityReply.findUniqueOrThrow({ where: { id } });
  await db.communityReply.update({ where: { id }, data: { hidden: !reply.hidden } });
  refreshMarket();
  revalidatePath(`/market/community/${reply.postId}`);
}

// ───────── 举报 ─────────

/** 处理举报；takedown=on 时同时下架/隐藏/封禁被举报对象 */
export async function handleReport(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!["RESOLVED", "DISMISSED"].includes(status)) return;
  const report = await db.report.findUniqueOrThrow({ where: { id } });
  if (status === "RESOLVED" && fd.get("takedown") === "on") {
    const t = report.targetId;
    switch (report.targetType) {
      case "LISTING":
        await db.listing.updateMany({ where: { id: t }, data: { status: "OFFLINE" } });
        break;
      case "WANTED":
        await db.wantedPost.updateMany({ where: { id: t }, data: { status: "HIDDEN" } });
        break;
      case "POST":
        await db.communityPost.updateMany({ where: { id: t }, data: { hidden: true } });
        break;
      case "USER":
        await db.user.updateMany({ where: { id: t, role: { not: "ADMIN" } }, data: { banned: true } });
        break;
    }
  }
  await db.report.update({ where: { id }, data: { status, handleNote: str(fd, "handleNote") || null } });
  refreshMarket();
}
