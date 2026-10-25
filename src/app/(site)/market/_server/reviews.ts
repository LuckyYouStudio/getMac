import "server-only";
import { db } from "@/lib/db";
import { addDays } from "@/lib/dates";
import { MARKET_LIMITS } from "@/lib/constants";

/**
 * 互评同时公开：双方都交了，或成交满 14 天后，把未公开的评价一起公开。
 * 读取评价前惰性调用。
 */
export async function publishDueReviews() {
  const cutoff = addDays(new Date(), -MARKET_LIMITS.reviewWindowDays);
  const pending = await db.review.findMany({
    where: { publishedAt: null },
    select: { id: true, dealId: true, deal: { select: { confirmedAt: true, _count: { select: { reviews: true } } } } },
  });
  const due = pending.filter((r) => r.deal._count.reviews >= 2 || (r.deal.confirmedAt && r.deal.confirmedAt < cutoff));
  if (due.length === 0) return;
  await db.review.updateMany({ where: { id: { in: due.map((r) => r.id) } }, data: { publishedAt: new Date() } });
}

/** 房东公开记录：近 90 天首条咨询的回复情况、双方确认的成交数、评价 */
export async function hostStats(hostId: string) {
  await publishDueReviews();
  const since = addDays(new Date(), -90);
  const [inquiries, deals, reviews] = await Promise.all([
    db.inquiry.findMany({
      where: { hostId, listingId: { not: null }, createdAt: { gte: since } },
      select: { createdAt: true, hostRepliedAt: true, renterId: true },
    }),
    db.deal.count({ where: { status: "CONFIRMED", hidden: false, inquiry: { hostId } } }),
    db.review.findMany({
      where: { targetId: hostId, publishedAt: { not: null }, hidden: false },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { name: true } } },
      take: 20,
    }),
  ]);
  const renters = new Set(inquiries.map((i) => i.renterId)).size;
  const replied = inquiries.filter((i) => i.hostRepliedAt);
  const within24 = replied.filter((i) => i.hostRepliedAt!.getTime() - i.createdAt.getTime() <= 86400000).length;
  const enough = renters >= 5;
  return {
    enough,
    inquiryCount: inquiries.length,
    replyRate: inquiries.length ? Math.round((replied.length / inquiries.length) * 100) : 0,
    within24Rate: inquiries.length ? Math.round((within24 / inquiries.length) * 100) : 0,
    deals,
    reviews,
    avgRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null,
  };
}
