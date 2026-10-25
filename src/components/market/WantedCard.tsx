import Link from "next/link";
import type { User, WantedPost } from "@prisma/client";
import { WANTED_STATUS } from "@/lib/constants";
import { ago, date } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import { countryName } from "./labels";

export function budgetText(w: Pick<WantedPost, "budgetMin" | "budgetMax">) {
  if (w.budgetMin && w.budgetMax) return `USD ${w.budgetMin}–${w.budgetMax} / 月`;
  if (w.budgetMax) return `USD ${w.budgetMax} 以内 / 月`;
  if (w.budgetMin) return `USD ${w.budgetMin} 起 / 月`;
  return "预算面议";
}

export function WantedCard({ w }: { w: WantedPost & { user: Pick<User, "name">; _count: { responses: number } } }) {
  const needs = [
    w.chipMin && `${w.chipMin} 起`,
    w.memMin && `${w.memMin}GB 起`,
    w.adminNeeded && "需要管理员权限",
    `租 ${w.termMonths} 个月`,
  ].filter(Boolean);
  return (
    <Link href={`/market/wanted/${w.id}`} className="card block min-w-0 p-5 transition hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate font-semibold">{w.title}</h3>
        {w.status === "OPEN" ? (
          <span className="shrink-0 text-sm font-semibold text-navy">{budgetText(w)}</span>
        ) : (
          <StatusBadge map={WANTED_STATUS} value={w.status} />
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">用途：{w.purpose}</p>
      <p className="mt-1 text-sm text-muted">{needs.join(" · ")}</p>
      <div className="mt-3 flex justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
        <span className="truncate">
          {[countryName(w.country) || "地区不限", w.region].filter(Boolean).join(" ")}
          {w.startDate && ` · ${date(w.startDate).slice(5)} 起`}
        </span>
        <span className="shrink-0">{w.user.name} · {ago(w.createdAt)} · {w._count.responses} 个回应</span>
      </div>
    </Link>
  );
}
