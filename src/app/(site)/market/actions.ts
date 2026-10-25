"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type ListingFormState = { error?: string } | undefined;

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function back(fd: FormData, fallback: string) {
  const r = str(fd, "returnTo");
  return r.startsWith("/") && !r.startsWith("//") ? r : fallback;
}

const int = (msg: string) => z.coerce.number({ error: msg }).int(msg).min(0, msg);

const listingSchema = z.object({
  title: z.string().trim().min(4, "标题至少 4 个字").max(60, "标题最多 60 字"),
  country: z.string().trim().min(1, "请填写国家/地区").max(30),
  region: z.string().trim().max(30).optional(),
  city: z.string().trim().max(30).optional(),
  deviceModel: z.string().trim().min(1, "请选择设备型号"),
  memory: int("内存需为整数").min(1, "请填写内存"),
  storage: int("硬盘需为整数").min(1, "请填写硬盘容量"),
  adminAccess: z.enum(["YES", "NO", "NEGOTIABLE"], { error: "请选择权限" }),
  network: z.enum(["HOME", "OFFICE", "DATACENTER"], { error: "请选择网络类型" }),
  currency: z.enum(["USD", "CNY"], { error: "请选择币种" }),
  price: int("月租需为整数").min(1, "请填写月租"),
  minMonths: int("最短租期需为整数").min(1, "最短租期至少 1 个月").max(24, "最短租期最多 24 个月"),
  firstPayment: int("首期需为非负整数"),
  deposit: int("押金需为非负整数"),
  extraFees: z.string().trim().max(100).optional(),
  description: z.string().trim().min(20, "描述至少 20 字，写清交付方式和使用限制").max(3000, "描述最多 3000 字"),
});

/** 新建或编辑出租方案。保存后一律回到待审核。 */
export async function saveListingAction(_: ListingFormState, fd: FormData): Promise<ListingFormState> {
  const user = await requireUser("/market/publish");
  if (user.hostStatus !== "VERIFIED" && user.role !== "ADMIN") {
    return { error: "通过房东认证后才能发布方案" };
  }
  const raw = Object.fromEntries(
    ["title", "country", "region", "city", "deviceModel", "memory", "storage", "adminAccess", "network",
      "currency", "price", "minMonths", "firstPayment", "deposit", "extraFees", "description"].map((k) => [k, str(fd, k)]),
  );
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = {
    ...parsed.data,
    region: parsed.data.region || null,
    city: parsed.data.city || null,
    extraFees: parsed.data.extraFees || null,
  };

  const id = str(fd, "id");
  if (id) {
    const existing = await db.listing.findUnique({ where: { id } });
    if (!existing || existing.hostId !== user.id) return { error: "无权编辑该方案" };
    await db.listing.update({
      where: { id },
      data: { ...data, status: "PENDING", rejectReason: null, confirmedAt: new Date() },
    });
  } else {
    await db.listing.create({ data: { ...data, hostId: user.id, status: "PENDING" } });
  }
  revalidatePath("/market");
  redirect("/market/mine?saved=1");
}

/** 我的方案：下架 / 重新上架 / 确认仍可租 */
export async function listingOpAction(fd: FormData) {
  const user = await requireUser("/market/mine");
  const id = str(fd, "id");
  const op = str(fd, "op");
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || listing.hostId !== user.id) redirect("/market/mine");

  if (op === "offline" && listing.status === "PUBLISHED") {
    await db.listing.update({ where: { id }, data: { status: "OFFLINE" } });
  } else if (op === "relist" && (listing.status === "OFFLINE" || listing.status === "REJECTED")) {
    await db.listing.update({ where: { id }, data: { status: "PENDING", rejectReason: null } });
  } else if (op === "confirm" && listing.status === "PUBLISHED") {
    await db.listing.update({ where: { id }, data: { confirmedAt: new Date() } });
  }
  revalidatePath("/market");
  revalidatePath("/market/mine");
  redirect("/market/mine");
}

/** 发起咨询：一个租客对一个方案只有一条会话 */
export async function inquireAction(fd: FormData) {
  const listingId = str(fd, "listingId");
  const user = await requireUser(`/market/${listingId}`);
  const body = str(fd, "body").slice(0, 2000);
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "PUBLISHED") redirect("/market");
  if (listing.hostId === user.id) redirect(`/market/${listingId}?err=own`);
  if (!body) redirect(`/market/${listingId}?err=empty`);

  const inquiry = await db.inquiry.upsert({
    where: { listingId_renterId: { listingId, renterId: user.id } },
    create: { listingId, renterId: user.id, hostId: listing.hostId },
    update: {},
  });
  await db.message.create({ data: { inquiryId: inquiry.id, senderId: user.id, body } });
  await db.inquiry.update({ where: { id: inquiry.id }, data: { updatedAt: new Date() } });
  redirect(`/messages/${inquiry.id}`);
}

/** 举报方案 / 求租帖 / 帖子 / 用户 */
export async function reportAction(fd: FormData) {
  const returnTo = back(fd, "/market");
  const user = await requireUser(returnTo);
  const targetType = str(fd, "targetType");
  const targetId = str(fd, "targetId");
  const reason = str(fd, "reason").slice(0, 500);
  const sep = returnTo.includes("?") ? "&" : "?";
  if (!["LISTING", "WANTED", "POST", "USER"].includes(targetType) || !targetId || reason.length < 4) {
    redirect(`${returnTo}${sep}report=invalid`);
  }
  await db.report.create({ data: { reporterId: user.id, targetType, targetId, reason } });
  redirect(`${returnTo}${sep}report=ok`);
}

/** 申请房东认证 */
export async function applyHostAction(fd: FormData) {
  const user = await requireUser("/market/become-host");
  const hostIntro = str(fd, "hostIntro").slice(0, 1000);
  const wechat = str(fd, "wechat").slice(0, 50);
  if (hostIntro.length < 10) redirect("/market/become-host?err=intro");
  if (user.hostStatus === "VERIFIED") redirect("/market/become-host");
  await db.user.update({
    where: { id: user.id },
    data: { hostIntro, wechat: wechat || user.wechat, hostStatus: "PENDING" },
  });
  redirect("/market/become-host?applied=1");
}

export async function createWantedAction(fd: FormData) {
  const user = await requireUser("/market/wanted");
  const title = str(fd, "title").slice(0, 60);
  const requirements = str(fd, "requirements").slice(0, 2000);
  if (title.length < 4 || requirements.length < 10) redirect("/market/wanted?err=1#new");
  await db.wantedPost.create({
    data: {
      userId: user.id,
      title,
      requirements,
      region: str(fd, "region").slice(0, 30) || null,
      budget: str(fd, "budget").slice(0, 30) || null,
    },
  });
  revalidatePath("/market/wanted");
  redirect("/market/wanted?posted=1");
}

export async function closeWantedAction(fd: FormData) {
  const user = await requireUser("/market/wanted");
  const id = str(fd, "id");
  const post = await db.wantedPost.findUnique({ where: { id } });
  if (post && post.userId === user.id && post.status === "OPEN") {
    await db.wantedPost.update({ where: { id }, data: { status: "CLOSED" } });
  }
  revalidatePath("/market/wanted");
  redirect("/market/wanted");
}

export async function createPostAction(fd: FormData) {
  const user = await requireUser("/market/community");
  const title = str(fd, "title").slice(0, 80);
  const body = str(fd, "body").slice(0, 5000);
  if (title.length < 4 || body.length < 10) redirect("/market/community?err=1#new");
  const post = await db.communityPost.create({ data: { userId: user.id, title, body } });
  revalidatePath("/market/community");
  redirect(`/market/community/${post.id}`);
}

export async function createReplyAction(fd: FormData) {
  const postId = str(fd, "postId");
  const user = await requireUser(`/market/community/${postId}`);
  const body = str(fd, "body").slice(0, 2000);
  const post = await db.communityPost.findUnique({ where: { id: postId } });
  if (!post || post.hidden) redirect("/market/community");
  if (body) await db.communityReply.create({ data: { postId, userId: user.id, body } });
  revalidatePath(`/market/community/${postId}`);
  redirect(`/market/community/${postId}#replies`);
}
