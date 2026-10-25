import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MarketTabs } from "@/components/market/MarketTabs";

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user
    ? await db.message.count({
        where: { read: false, senderId: { not: user.id }, inquiry: { OR: [{ renterId: user.id }, { hostId: user.id }] } },
      })
    : 0;
  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page flex items-center justify-between gap-4">
          <MarketTabs unread={unread} />
          <div className="flex shrink-0 gap-2">
            <Link href="/market/mine" className="btn-ghost btn-sm hidden sm:inline-flex">我的方案</Link>
            <Link href="/market/publish" className="btn-primary btn-sm">发布方案</Link>
          </div>
        </div>
      </div>
      <div className="container-page py-8">{children}</div>
    </>
  );
}
