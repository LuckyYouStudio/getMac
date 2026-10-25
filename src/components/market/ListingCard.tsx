import Link from "next/link";
import type { Listing, User } from "@prisma/client";
import { ADMIN_ACCESS, NETWORK } from "@/lib/constants";
import { ago, money } from "@/lib/format";
import { Badge, ShieldIcon } from "@/components/ui";

export function location(l: Pick<Listing, "country" | "region" | "city">) {
  return [l.country, l.region, l.city].filter(Boolean).join(" ");
}

export function ListingCard({ listing: l }: { listing: Listing & { host: Pick<User, "name" | "hostStatus"> } }) {
  const fees = (n: number) => (n > 0 ? money(n, l.currency) : "无");
  return (
    <Link href={`/market/${l.id}`} className="card group block min-w-0 p-5 transition hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink group-hover:text-brand">{l.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {location(l)} · {l.deviceModel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-lg font-semibold text-navy">{money(l.price, l.currency)}</span>
          <span className="text-sm text-muted"> / 月</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {l.memory}GB / {l.storage >= 1024 ? `${l.storage / 1024}TB` : `${l.storage}GB`} · {ADMIN_ACCESS[l.adminAccess]} · {NETWORK[l.network]}
        <span className="ml-1 text-xs text-muted">房东自述</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        最短 {l.minMonths} 月 · 首期 {fees(l.firstPayment)} · 押金 {fees(l.deposit)} · 额外费用 {l.extraFees || "无"}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="text-ink-soft">{l.host.name}</span>
          {l.host.hostStatus === "VERIFIED" && (
            <span className="inline-flex items-center gap-0.5 text-safe"><ShieldIcon className="h-3.5 w-3.5" />认证房东</span>
          )}
          · {ago(l.confirmedAt)}确认
        </span>
        <Badge tone="ok">可咨询</Badge>
      </div>
    </Link>
  );
}
