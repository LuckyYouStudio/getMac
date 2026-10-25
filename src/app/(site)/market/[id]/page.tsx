import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { trackView } from "@/lib/track";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { parseList } from "@/lib/json";
import { ADMIN_ACCESS, LISTING_STATUS, NETWORK, RESTART } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { Badge, Notice, StatusBadge } from "@/components/ui";
import { Flash } from "@/components/market/Flash";
import { HostCard } from "@/components/market/HostCard";
import { InquiryForm } from "@/components/market/InquiryForm";
import { ReportForm } from "@/components/market/ReportForm";
import { availabilityLabel, availabilityTone, fee, location, priceLine } from "@/components/market/labels";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await db.listing.findUnique({ where: { id }, select: { title: true } });
  return { title: l?.title ?? "出租方案" };
}

const PUBLIC = ["PUBLISHED", "PAUSED"];

const CHECKLIST = [
  "机器具体在哪个城市，用的什么网络，有没有 UPS",
  "给不给管理员权限，能不能自己装软件",
  "用什么方式交付（UU / SSH / 其他），首次连接谁来协助",
  "停电、死机、断网时多久能恢复，联系谁",
  "首期、押金怎么付，什么情况下退",
  "到期后数据怎么处理，会不会整盘抹除",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({ k, v, self }: { k: string; v: ReactNode; self?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/70 pb-2 sm:block sm:border-0 sm:pb-0">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right sm:mt-0.5 sm:text-left">
        {v || "未填写"}
        {self && <span className="ml-1 text-xs text-muted">房东自述</span>}
      </dd>
    </div>
  );
}

export default async function ListingDetail({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await expireStaleMarket();
  const [l, user] = await Promise.all([
    db.listing.findUnique({ where: { id }, include: { host: true } }),
    getCurrentUser(),
  ]);
  if (!l) notFound();
  const isOwner = user?.id === l.hostId;
  const isAdmin = user?.role === "ADMIN";
  if (!PUBLIC.includes(l.status) && !isOwner && !isAdmin) notFound();

  if (!isOwner && l.status === "PUBLISHED") {
    await Promise.all([
      db.listing.update({ where: { id }, data: { views: { increment: 1 } } }),
      trackView("/market/listing"),
    ]);
  }

  const existing = user && !isOwner ? await db.inquiry.findFirst({ where: { listingId: id, renterId: user.id }, select: { id: true } }) : null;
  const remote = parseList(l.remoteMethods);
  const back = `/market/${id}`;
  const disk = (n: number) => (n >= 1024 ? `${n / 1024}TB` : `${n}GB`);

  let inquiryBox: ReactNode;
  if (isOwner) {
    inquiryBox = (
      <div className="space-y-2 text-sm">
        <p className="text-ink-soft">这是你发布的方案。</p>
        <Link href={`/market/${id}/edit`} className="btn-outline w-full">编辑方案</Link>
        <Link href="/market/mine" className="btn-ghost w-full">管理我的方案</Link>
      </div>
    );
  } else if (existing) {
    inquiryBox = <Link href={`/market/messages/${existing.id}`} className="btn-primary w-full">继续对话</Link>;
  } else if (l.status === "PAUSED") {
    inquiryBox = <p className="text-sm text-muted">房东暂停了新的咨询，已有对话不受影响。</p>;
  } else if (l.availability === "FULL") {
    inquiryBox = <p className="text-sm text-muted">房东标注暂无空位，暂时不能咨询。可以先<Link href="/market/wanted/new" className="text-brand hover:underline">发一条求租</Link>。</p>;
  } else if (!user) {
    inquiryBox = (
      <div className="space-y-2 text-sm">
        <p className="text-ink-soft">登录后可以在站内向房东咨询，咨询不会产生费用。</p>
        <Link href={`/login?next=${encodeURIComponent(back)}`} className="btn-primary w-full">登录后咨询</Link>
      </div>
    );
  } else {
    inquiryBox = <InquiryForm listingId={id} />;
  }

  return (
    <div className="space-y-6">
      <Link href="/market" className="text-sm text-muted hover:text-brand">← 返回找设备</Link>
      <Flash ok={sp.ok} err={sp.err} />

      {!PUBLIC.includes(l.status) && (
        <Notice tone="info">
          当前状态：<StatusBadge map={LISTING_STATUS} value={l.status} />，只有你{isAdmin && !isOwner ? "（管理员）" : ""}能看到这个页面。
          {l.reviewNote && <span className="mt-1 block">平台说明：{l.reviewNote}</span>}
        </Notice>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{l.title}</h1>
          <p className="mt-1 text-sm text-muted">{location(l)} · {l.machineType} {l.chip}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={availabilityTone(l)}>{availabilityLabel(l)}</Badge>
            {l.status === "PAUSED" && <Badge tone="info">暂停新咨询</Badge>}
            <Badge>{date(l.confirmedAt)} 房东确认仍可租</Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-navy">{money(l.price, l.currency)}<span className="text-base font-normal text-muted"> / 月</span></div>
          <p className="mt-1 max-w-sm text-sm text-muted">{priceLine(l)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Section title="配置">
            <Row k="机型" v={l.machineType} self />
            <Row k="芯片" v={l.chip} self />
            <Row k="内存 / 硬盘" v={`${l.memory}GB / ${disk(l.storage)}`} self />
            <Row k="系统版本" v={l.osVersion} self />
          </Section>
          <Section title="地点与网络">
            <Row k="所在地" v={location(l)} />
            <Row k="网络类型" v={NETWORK[l.network]} self />
            <Row k="带宽" v={l.bandwidth} self />
          </Section>
          <Section title="使用条件">
            <Row k="使用方式" v="整机独占，按月起租" />
            <Row k="权限" v={ADMIN_ACCESS[l.adminAccess]} />
            <Row k="远程方式" v={remote.join(" / ")} />
            <Row k="SSH" v={l.ssh ? "支持" : "不支持"} />
            <Row k="远程重启" v={RESTART[l.restart]} />
            <Row k="自行安装软件" v={l.selfInstall ? "允许" : "需先和房东确认"} />
          </Section>
          <Section title="费用">
            <Row k="月租" v={money(l.price, l.currency)} />
            <Row k="最短租期" v={`${l.minMonths} 个月`} />
            <Row k="首期" v={money(l.firstPayment, l.currency)} />
            <Row k="押金" v={fee(l.deposit, l.currency)} />
            <Row k="额外费用" v={l.extraFees || "无"} />
            <Row k="付款方式" v={l.paymentMethods} />
          </Section>
          <Section title="服务约定">
            <Row k="响应时间" v={l.supportHours} />
            <Row k="交付说明" v={l.deliveryNotes} />
            <Row k="退款约定" v={l.refundPolicy} />
            <Row k="到期数据处理" v={l.dataCleanup} />
            {l.hostWebsite && <Row k="房东网站" v={<a href={l.hostWebsite} target="_blank" rel="noopener noreferrer nofollow" className="text-brand hover:underline">{l.hostWebsite}</a>} />}
          </Section>
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">房东的说明</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-ink-soft">{l.description}</p>
          </section>
          <section className="card p-5">
            <h2 className="font-semibold">付款之前，先问清楚这些</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {CHECKLIST.map((c) => <li key={c} className="flex gap-2"><span className="text-safe">✓</span>{c}</li>)}
            </ul>
            <Link href="/guides/questions-before-renting" className="mt-3 inline-block text-sm text-brand hover:underline">完整清单 →</Link>
          </section>
          <Notice tone="warn">
            方案内容由房东自行填写，GetMac 不核验设备，不经手租金。第一次合作请按月付，不要大额预付；有人要求站外私下联系或先付大额款项，请提高警惕并举报。
          </Notice>
          <div className="flex justify-between text-xs text-muted">
            <span>浏览 {l.views} 次 · {date(l.publishedAt ?? l.createdAt)} 发布</span>
            {!isOwner && <ReportForm targetType="LISTING" targetId={id} returnTo={back} loggedIn={!!user} label="举报这个方案" />}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">向房东咨询</h2>
            {inquiryBox}
          </div>
          <HostCard host={l.host} />
        </aside>
      </div>
    </div>
  );
}
