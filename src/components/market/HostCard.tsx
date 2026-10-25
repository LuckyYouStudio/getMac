import Link from "next/link";
import type { User } from "@prisma/client";
import { date } from "@/lib/format";
import { hostStats } from "@/app/(site)/market/_server/reviews";

/** 房东公开信息卡。平台不核验身份和设备，这里只展示站内可查的记录。 */
export async function HostCard({ host, compact = false }: { host: Pick<User, "id" | "name" | "createdAt" | "bio">; compact?: boolean }) {
  const s = await hostStats(host.id);
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {host.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <Link href={`/market/hosts/${host.id}`} className="font-semibold hover:text-brand">{host.name}</Link>
          <div className="text-xs text-muted">{date(host.createdAt)} 注册</div>
        </div>
      </div>
      {!compact && host.bio && <p className="mt-3 text-sm text-ink-soft">{host.bio}</p>}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">近 90 天回复</dt>
          <dd className="text-right">{s.enough ? `回复率 ${s.replyRate}% · 24 小时内 ${s.within24Rate}%` : "暂无足够记录"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">双方确认的成交</dt>
          <dd>{s.deals} 次</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">评价</dt>
          <dd>{s.avgRating ? `${s.avgRating.toFixed(1)} 星 · ${s.reviews.length} 条` : "暂无"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-muted">
        以上是站内记录。平台不核验房东身份，也不核验设备是否与描述一致。
      </p>
      {compact || <Link href={`/market/hosts/${host.id}`} className="mt-3 inline-block text-sm text-brand hover:underline">查看房东主页 →</Link>}
    </div>
  );
}
