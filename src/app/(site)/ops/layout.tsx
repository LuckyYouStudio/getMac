import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { OpsNav } from "@/components/official/OpsNav";

export const metadata = { title: "房东后台" };

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/ops");

  if (!user.officialHost) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold text-navy">还没有开通官方房东</h1>
          <p className="mt-2 text-sm leading-6 text-muted">房东后台用于登记和托管你的 Mac mini。开通只需同意协议，不需要审核资料。</p>
          <Link href="/join#signup" className="btn-primary mt-6">了解并开通</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="text-sm">
            <span className="font-semibold text-navy">房东后台</span>
            <span className="ml-2 text-muted">{user.name}</span>
          </div>
          <OpsNav />
        </div>
      </div>
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
