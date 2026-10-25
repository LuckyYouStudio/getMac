import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { trackView } from "@/lib/track";
import { ADMIN_ACCESS, HOST_STATUS, LISTING_STATUS, NETWORK } from "@/lib/constants";
import { ago, date, money } from "@/lib/format";
import { Badge, CheckIcon, Notice, ShieldIcon, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { location } from "@/components/market/ListingCard";
import { ReportForm, ReportResult } from "@/components/market/ReportForm";
import { inquireAction } from "../actions";

const CHECKLIST = [
  "机器实际在哪座城市？用的是家庭宽带还是办公网络？",
  "给的是管理员账号还是标准用户？能不能自己装软件？",
  "交付方式是什么（UU 远程、Tailscale、SSH）？多久能交付？",
  "停电、死机、断网时谁来处理，一般多久恢复？",
  "到期或提前退租时，数据怎么清除？押金怎么退？",
  "除了月租，还有没有其他费用？",
];

export default async function ListingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; report?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, hostStatus: true, hostIntro: true, createdAt: true, _count: { select: { listings: { where: { status: "PUBLISHED" } } } } } },
    },
  });
  if (!listing) notFound();
  const isOwner = user?.id === listing.hostId;
  const isAdmin = user?.role === "ADMIN";
  if (listing.status !== "PUBLISHED" && !isOwner && !isAdmin) notFound();

  if (listing.status === "PUBLISHED" && !isOwner) {
    await db.listing.update({ where: { id }, data: { views: { increment: 1 } } });
    await trackView("/market/listing");
  }

  const existing = user && !isOwner
    ? await db.inquiry.findUnique({ where: { listingId_renterId: { listingId: id, renterId: user.id } } })
    : null;

  const fee = (n: number) => (n > 0 ? money(n, listing.currency) : "无");
  const rows: [string, string][] = [
    ["所在地区", location(listing) || "—"],
    ["设备型号", listing.deviceModel],
    ["内存 / 硬盘", `${listing.memory}GB / ${listing.storage >= 1024 ? `${listing.storage / 1024}TB` : `${listing.storage}GB`}`],
    ["账号权限", ADMIN_ACCESS[listing.adminAccess]],
    ["网络环境", NETWORK[listing.network]],
    ["月租", `${money(listing.price, listing.currency)} / 月`],
    ["最短租期", `${listing.minMonths} 个月`],
    ["首期", fee(listing.firstPayment)],
    ["押金", fee(listing.deposit)],
    ["额外费用", listing.extraFees || "无"],
  ];

  return (
    <div className="space-y-6">
      <Link href="/market" className="text-sm text-muted hover:text-brand">← 返回找设备</Link>

      {listing.status !== "PUBLISHED" && (
        <Notice tone="info">
          该方案当前状态：<StatusBadge map={LISTING_STATUS} value={listing.status} />，仅房东本人和管理员可见。
          {listing.rejectReason && <span className="mt-1 block">未通过原因：{listing.rejectReason}</span>}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
                <p className="mt-1 text-sm text-muted">
                  {location(listing)} · {listing.deviceModel} · 浏览 {listing.views} 次 · {ago(listing.confirmedAt)}确认仍可租
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-navy">{money(listing.price, listing.currency)}</div>
                <div className="text-sm text-muted">每月</div>
              </div>
            </div>
            <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-dashed border-line pb-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted">以上信息均为房东自述，GetMac 未做核验。</p>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">房东的说明</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{listing.description}</div>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldIcon className="h-5 w-5 text-safe" />问清楚这些再付款</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2"><CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-safe" />{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft font-semibold text-brand">
                {listing.host.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="font-medium">{listing.host.name}</div>
                <StatusBadge map={HOST_STATUS} value={listing.host.hostStatus} />
              </div>
            </div>
            {listing.host.hostIntro && <p className="mt-3 text-sm text-ink-soft">{listing.host.hostIntro}</p>}
            <p className="mt-3 text-xs text-muted">
              {date(listing.host.createdAt)} 加入 · 发布中方案 {listing.host._count.listings} 个
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold">站内咨询房东</h2>
            {isOwner ? (
              <div className="mt-3 space-y-3 text-sm text-muted">
                <p>这是你发布的方案。</p>
                <Link href={`/market/${listing.id}/edit`} className="btn-outline w-full">编辑方案</Link>
              </div>
            ) : existing ? (
              <div className="mt-3 space-y-3 text-sm text-muted">
                <p>你已经和房东聊过这台机器。</p>
                <Link href={`/messages/${existing.id}`} className="btn-primary w-full">继续对话</Link>
              </div>
            ) : listing.status !== "PUBLISHED" ? (
              <p className="mt-3 text-sm text-muted">方案未发布，暂不可咨询。</p>
            ) : (
              <form action={inquireAction} className="mt-3 space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <textarea
                  name="body"
                  required
                  rows={5}
                  maxLength={2000}
                  className="input"
                  defaultValue={`你好，我对「${listing.title}」感兴趣。想确认一下：交付方式和时间？是否支持按月付？`}
                />
                {sp.err === "empty" && <p className="text-xs text-danger">请填写咨询内容</p>}
                {user ? (
                  <SubmitButton className="btn-primary w-full" pendingText="发送中…">发送咨询</SubmitButton>
                ) : (
                  <Link href={`/login?next=/market/${listing.id}`} className="btn-primary w-full">登录后咨询</Link>
                )}
              </form>
            )}
            <p className="mt-3 text-xs leading-5 text-muted">
              请尽量在站内沟通并保留记录。不要在站外向陌生人大额转账。
            </p>
          </div>

          <Notice tone="warn">
            第三方房东的方案，GetMac 不经手租金、不对交付和售后负责。首次合作建议按月付。
          </Notice>

          {!isOwner && (
            <div className="card space-y-2 p-4">
              <ReportResult value={sp.report} />
              <ReportForm targetType="LISTING" targetId={listing.id} returnTo={`/market/${listing.id}`} label="发现问题？举报这个方案" />
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <Badge tone="info">平台审核后展示</Badge>
            <Link href="/market/rules" className="hover:text-brand">市场规则 →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
