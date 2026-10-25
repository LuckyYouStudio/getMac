import "server-only";
import { db } from "./db";
import { today } from "./format";

/** 记录一次页面浏览（按天聚合）。失败不影响页面渲染。 */
export async function trackView(path: string) {
  try {
    await db.pageView.upsert({
      where: { day_path: { day: today(), path } },
      create: { day: today(), path, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // 忽略统计失败
  }
}
