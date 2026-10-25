import Link from "next/link";
import { HOST_STATUS } from "@/lib/constants";
import { ShieldIcon, StatusBadge } from "@/components/ui";

/** 未通过房东认证时替代发布表单的提示 */
export function HostGate({ hostStatus }: { hostStatus: string }) {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <ShieldIcon className="mx-auto h-10 w-10 text-safe" />
      <h1 className="mt-4 text-xl font-semibold">通过房东认证后才能发布方案</h1>
      <p className="mt-2 text-sm text-muted">
        为了让租客更放心，每位房东都需要先通过平台认证。当前状态：<StatusBadge map={HOST_STATUS} value={hostStatus} />
      </p>
      <Link href="/market/become-host" className="btn-primary mt-6">
        {hostStatus === "PENDING" ? "查看认证进度" : "申请成为房东"}
      </Link>
    </div>
  );
}
