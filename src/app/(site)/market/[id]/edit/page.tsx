import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LISTING_STATUS } from "@/lib/constants";
import { Notice, PageHeader, StatusBadge } from "@/components/ui";
import { Flash } from "@/components/market/Flash";
import { ListingWizard } from "@/components/market/ListingWizard";

export const metadata = { title: "编辑出租方案" };

export default async function EditListingPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/market/${id}/edit`);
  const l = await db.listing.findUnique({ where: { id } });
  if (!l || l.hostId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={l.status === "DRAFT" ? "继续填写草稿" : "编辑出租方案"}
        desc={<>当前状态 <StatusBadge map={LISTING_STATUS} value={l.status} /></>}
      />
      <Flash ok={sp.ok} err={sp.err} />
      {l.status === "REMOVED" ? (
        <Notice tone="warn">该方案已被平台下架，不能再编辑。原因：{l.reviewNote ?? "违反市场规则"}</Notice>
      ) : (
        <>
          {l.status === "NEEDS_CHANGES" && l.reviewNote && (
            <Notice tone="warn">平台要求修改：{l.reviewNote}。修改后保存即可重新展示。</Notice>
          )}
          {l.status === "PUBLISHED" && <Notice tone="info">保存修改后方案继续展示，并自动续期 14 天。</Notice>}
          <ListingWizard listing={l} />
        </>
      )}
    </div>
  );
}
