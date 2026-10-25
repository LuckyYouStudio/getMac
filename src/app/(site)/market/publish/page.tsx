import { requireUser } from "@/lib/auth";
import { Notice, PageHeader } from "@/components/ui";
import { ListingForm } from "@/components/market/ListingForm";
import { HostGate } from "@/components/market/HostGate";

export const metadata = { title: "发布出租方案" };

export default async function PublishPage() {
  const user = await requireUser("/market/publish");
  if (user.hostStatus !== "VERIFIED" && user.role !== "ADMIN") return <HostGate hostStatus={user.hostStatus} />;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="发布出租方案" desc="如实填写配置和条件。所有方案都需要平台审核后才会公开展示。" />
      <div className="mb-6">
        <Notice tone="info">不允许出租或代开第三方账号、VPN/代理服务；不允许挖矿、刷量等用途。详见市场规则。</Notice>
      </div>
      <ListingForm />
    </div>
  );
}
