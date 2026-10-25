"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { listingRenewal } from "@/lib/market-lifecycle";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refreshMarket() {
  revalidatePath("/admin", "layout");
  revalidatePath("/market", "layout");
}

// ───────── 出租方案复查（先发布、后复查）─────────

export async function reviewListing(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const decision = str(fd, "decision"); // changes | remove | restore
  const note = str(fd, "reviewNote");
  if (decision === "changes") {
    await db.listing.update({ where: { id }, data: { status: "NEEDS_CHANGES", reviewNote: note || "请按市场规则修改方案内容后重新提交。" } });
  } else if (decision === "remove") {
    await db.listing.update({ where: { id }, data: { status: "REMOVED", reviewNote: note || "方案违反市场规则，已被下架。" } });
  } else if (decision === "restore") {
    await db.listing.update({ where: { id }, data: { status: "PUBLISHED", reviewNote: null, ...listingRenewal() } });
  } else return;
  refreshMarket();
  revalidatePath(`/market/${id}`);
}

// ───────── 求租帖 ─────────

export async function setWantedStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!["OPEN", "FILLED", "CLOSED", "HIDDEN"].includes(status)) return;
  const id = str(fd, "id");
  await db.wantedPost.update({
    where: { id },
    data: { status, closedAt: status === "OPEN" ? null : new Date() },
  });
  refreshMarket();
  revalidatePath(`/market/wanted/${id}`);
}

// ───────── 交流区 ─────────

export async function setPostStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!["PUBLISHED", "HIDDEN"].includes(status)) return;
  await db.communityPost.update({ where: { id }, data: { status } });
  refreshMarket();
  revalidatePath(`/market/community/${id}`);
}

export async function togglePin(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const post = await db.communityPost.findUniqueOrThrow({ where: { id } });
  await db.communityPost.update({ where: { id }, data: { pinned: !post.pinned } });
  refreshMarket();
}

export async function setReplyStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!["PUBLISHED", "HIDDEN"].includes(status)) return;
  const reply = await db.communityReply.update({ where: { id }, data: { status } });
  refreshMarket();
  revalidatePath(`/market/community/${reply.postId}`);
}

// ───────── 成交与评价 ─────────

export async function toggleDealHidden(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const deal = await db.deal.findUniqueOrThrow({ where: { id } });
  await db.deal.update({ where: { id }, data: { hidden: !deal.hidden } });
  refreshMarket();
}

export async function toggleReviewHidden(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const review = await db.review.findUniqueOrThrow({ where: { id } });
  await db.review.update({ where: { id }, data: { hidden: !review.hidden } });
  refreshMarket();
}

// ───────── 举报 ─────────

/**
 * 处理举报。action：
 * none（只记录）| takedown（下架/隐藏被举报内容）| restrict（限制发布者）| ban（暂停发布者）
 */
export async function handleReport(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!["RESOLVED", "DISMISSED"].includes(status)) return;
  const report = await db.report.findUniqueOrThrow({ where: { id } });
  const action = str(fd, "action") || "none";
  if (status === "RESOLVED" && action !== "none") {
    const t = report.targetId;
    if (action === "takedown") {
      switch (report.targetType) {
        case "LISTING":
          await db.listing.updateMany({ where: { id: t }, data: { status: "REMOVED", reviewNote: `因举报下架：${str(fd, "handleNote") || "违反市场规则"}` } });
          break;
        case "WANTED":
          await db.wantedPost.updateMany({ where: { id: t }, data: { status: "HIDDEN" } });
          break;
        case "POST":
          await db.communityPost.updateMany({ where: { id: t }, data: { status: "HIDDEN" } });
          break;
        case "REPLY":
          await db.communityReply.updateMany({ where: { id: t }, data: { status: "HIDDEN" } });
          break;
        case "REVIEW":
          await db.review.updateMany({ where: { id: t }, data: { hidden: true } });
          break;
      }
    } else if (action === "restrict" || action === "ban") {
      const owner = await targetOwner(report.targetType, t);
      if (owner) {
        await db.user.updateMany({
          where: { id: owner, role: { not: "ADMIN" } },
          data: action === "ban" ? { banned: true } : { restricted: true },
        });
        if (action === "ban") {
          await db.listing.updateMany({ where: { hostId: owner, status: { in: ["PUBLISHED", "PAUSED"] } }, data: { status: "REMOVED", reviewNote: "账号已被暂停" } });
        }
      }
    }
  }
  await db.report.update({ where: { id }, data: { status, handleNote: str(fd, "handleNote") || null } });
  refreshMarket();
}

/** 被举报内容的发布者 */
async function targetOwner(type: string, id: string): Promise<string | null> {
  switch (type) {
    case "LISTING": return (await db.listing.findUnique({ where: { id } }))?.hostId ?? null;
    case "WANTED": return (await db.wantedPost.findUnique({ where: { id } }))?.userId ?? null;
    case "POST": return (await db.communityPost.findUnique({ where: { id } }))?.userId ?? null;
    case "REPLY": return (await db.communityReply.findUnique({ where: { id } }))?.userId ?? null;
    case "MESSAGE": return (await db.message.findUnique({ where: { id } }))?.senderId ?? null;
    case "REVIEW": return (await db.review.findUnique({ where: { id } }))?.authorId ?? null;
    case "USER": return id;
    default: return null;
  }
}
