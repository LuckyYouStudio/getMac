"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, startOfToday } from "@/lib/dates";
import { findContactInfo, hasLink } from "@/lib/contact-guard";
import { COMMUNITY_BOARDS, MARKET_LIMITS } from "@/lib/constants";
import { withMsg } from "@/components/market/labels";
import { assertCanStart, done, fail, isNewAccount, str } from "../_server/guards";

export async function createPostAction(fd: FormData) {
  const back = "/market/community/new";
  const user = await requireUser(back);
  assertCanStart(user, back);
  const board = str(fd, "board");
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (!(board in COMMUNITY_BOARDS)) fail(back, "请选择版块");
  if (title.length < 4 || title.length > 60) fail(back, "标题 4–60 字");
  if (body.length < 10 || body.length > 5000) fail(back, "正文 10–5000 字");
  const contact = findContactInfo(title, body);
  if (contact) fail(back, `帖子是公开的，不能留${contact}。`);

  const now = new Date();
  const today = await db.communityPost.findMany({
    where: { userId: user.id, createdAt: { gte: startOfToday() } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (today.length >= MARKET_LIMITS.dailyTopics) fail(back, `每天最多发 ${MARKET_LIMITS.dailyTopics} 个话题。`);
  if (today[0] && now.getTime() - today[0].createdAt.getTime() < MARKET_LIMITS.topicIntervalMinutes * 60000) {
    fail(back, `两个话题之间至少间隔 ${MARKET_LIMITS.topicIntervalMinutes} 分钟。`);
  }

  const needsReview = isNewAccount(user) || hasLink(body) || hasLink(title);
  const post = await db.communityPost.create({
    data: { userId: user.id, board, title, body, status: needsReview ? "PENDING" : "PUBLISHED" },
  });
  revalidatePath("/market/community");
  redirect(withMsg(`/market/community/${post.id}`, "ok", needsReview ? "已提交，审核通过后公开（新账号或含链接的帖子需要先审核）。" : "已发布"));
}

export async function editPostAction(fd: FormData) {
  const id = str(fd, "id");
  const back = `/market/community/${id}`;
  const user = await requireUser(back);
  const post = await db.communityPost.findUnique({ where: { id } });
  if (!post || post.userId !== user.id || post.status === "HIDDEN") fail(back, "帖子不存在");
  if (post.createdAt < new Date(Date.now() - MARKET_LIMITS.postEditMinutes * 60000)) {
    fail(back, `发布 ${MARKET_LIMITS.postEditMinutes} 分钟后不能再编辑。`);
  }
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (title.length < 4 || title.length > 60) fail(back, "标题 4–60 字");
  if (body.length < 10 || body.length > 5000) fail(back, "正文 10–5000 字");
  const contact = findContactInfo(title, body);
  if (contact) fail(back, `帖子是公开的，不能留${contact}。`);
  const needsReview = post.status === "PENDING" || hasLink(body) || hasLink(title);
  await db.communityPost.update({ where: { id }, data: { title, body, status: needsReview ? "PENDING" : "PUBLISHED" } });
  revalidatePath(back);
  done(back, needsReview ? "已保存，审核后公开。" : "已保存");
}

export async function deletePostAction(fd: FormData) {
  const id = str(fd, "id");
  const user = await requireUser(`/market/community/${id}`);
  const post = await db.communityPost.findUnique({ where: { id } });
  if (!post || post.userId !== user.id) fail("/market/community", "帖子不存在");
  await db.communityPost.update({ where: { id }, data: { status: "HIDDEN" } });
  revalidatePath("/market/community");
  done("/market/community", "帖子已删除");
}

export async function replyPostAction(fd: FormData) {
  const postId = str(fd, "postId");
  const back = `/market/community/${postId}`;
  const user = await requireUser(back);
  assertCanStart(user, back);
  const post = await db.communityPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== "PUBLISHED") fail("/market/community", "帖子不存在或未公开");
  const body = str(fd, "body");
  if (body.length < 2 || body.length > 2000) fail(back, "回复 2–2000 字");
  const contact = findContactInfo(body);
  if (contact) fail(back, `回复是公开的，不能留${contact}。`);

  const today = await db.communityReply.findMany({
    where: { userId: user.id, createdAt: { gte: startOfToday() } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const cap = isNewAccount(user) ? MARKET_LIMITS.newAccountDailyReplies : MARKET_LIMITS.dailyReplies;
  if (today.length >= cap) fail(back, `今天的回复已达上限（${cap} 条）。`);
  if (today[0] && Date.now() - today[0].createdAt.getTime() < MARKET_LIMITS.replyIntervalSeconds * 1000) {
    fail(back, `回复太快了，请 ${MARKET_LIMITS.replyIntervalSeconds} 秒后再试。`);
  }
  const needsReview = hasLink(body) || user.createdAt > addDays(new Date(), -1);
  await db.communityReply.create({ data: { postId, userId: user.id, body, status: needsReview ? "PENDING" : "PUBLISHED" } });
  revalidatePath(back);
  done(back, needsReview ? "回复已提交，审核后公开。" : "已回复");
}
