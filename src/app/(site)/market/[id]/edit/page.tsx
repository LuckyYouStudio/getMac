import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LISTING_STATUS } from "@/lib/constants";
import { Notice, PageHeader, StatusBadge } from "@/components/ui";
import { ListingForm } from "@/components/market/ListingForm";
import { HostGate } from "@/components/market/HostGate";

export const metadata = { title: "编辑出租方案" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/market/${id}/edit`);
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || listing.hostId !== user.id) notFound();
  if (user.hostStatus !== "VERIFIED" && user.role !== "ADMIN") return <HostGate hostStatus={user.hostStatus} />;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="编辑出租方案"
        desc={<>当前状态 <StatusBadge map={LISTING_STATUS} value={listing.status} /></>}
      />
      <div className="mb-6 space-y-3">
        {listing.rejectReason && <Notice tone="warn">上次未通过原因：{listing.rejectReason}</Notice>}
        <Notice tone="info">保存后方案会重新进入审核，审核期间暂停公开展示。</Notice>
      </div>
      <ListingForm listing={listing} />
    </div>
  );
}
