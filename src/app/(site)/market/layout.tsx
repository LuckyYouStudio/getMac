import Link from "next/link";
import { MarketTabs } from "@/components/market/MarketTabs";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page flex items-center justify-between gap-4">
          <MarketTabs />
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
