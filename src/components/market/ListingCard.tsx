import Link from "next/link";
import type { Listing, User } from "@prisma/client";
import { ADMIN_ACCESS, NETWORK } from "@/lib/constants";
import { ago, money } from "@/lib/format";
import { Badge } from "@/components/ui";
import { availabilityLabel, availabilityTone, deviceLabel, location, priceLine } from "./labels";

export function ListingCard({ listing: l }: { listing: Listing & { host: Pick<User, "name"> } }) {
  return (
    <Link href={`/market/${l.id}`} className="card group block min-w-0 p-5 transition hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink group-hover:text-brand">{l.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {location(l)} · {deviceLabel(l)}
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
      <p className="mt-1 text-sm text-muted">{priceLine(l)}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
        <span className="truncate">
          <span className="text-ink-soft">{l.host.name}</span> · {ago(l.confirmedAt)}确认
        </span>
        <Badge tone={availabilityTone(l)}>{availabilityLabel(l)}</Badge>
      </div>
    </Link>
  );
}
