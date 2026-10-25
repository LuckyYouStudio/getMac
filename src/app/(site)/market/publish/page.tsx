import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MARKET_LIMITS } from "@/lib/constants";
import { Notice, PageHeader } from "@/components/ui";
import { ListingWizard } from "@/components/market/ListingWizard";

export const metadata = { title: "发布出租方案" };

export default async function PublishPage() {
  const user = await requireUser("/market/publish");
  const active = await db.listing.count({ where: { hostId: user.id, status: { in: ["PUBLISHED", "PAUSED", "NEEDS_CHANGES"] } } });
  const drafts = await db.listing.findMany({ where: { hostId: user.id, status: "DRAFT" }, select: { id: true, title: true } });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="发布出租方案" desc="免费发布。填完 6 步即可公开，平台事后复查。" />
      {user.restricted ? (
        <Notice tone="warn">你的账号目前受限，不能发布方案。如有疑问请联系客服。</Notice>
      ) : active >= MARKET_LIMITS.maxActiveListings ? (
        <Notice tone="warn">
          你已经有 {active} 个有效方案，达到上限。请先在<Link href="/market/mine" className="underline">我的方案</Link>里关闭不用的方案。
        </Notice>
      ) : (
        <div className="space-y-4">
          {drafts.length > 0 && (
            <Notice tone="info">
              你有未完成的草稿：
              {drafts.map((d) => <Link key={d.id} href={`/market/${d.id}/edit`} className="ml-2 underline">{d.title}</Link>)}
            </Notice>
          )}
          <p className="text-sm text-muted">
            第一次出租？先看看<Link href="/guides/hosting-checklist" className="text-brand hover:underline">出租前准备清单</Link>和
            <Link href="/market/rules" className="text-brand hover:underline">市场规则</Link>。
          </p>
          <ListingWizard />
        </div>
      )}
    </div>
  );
}
