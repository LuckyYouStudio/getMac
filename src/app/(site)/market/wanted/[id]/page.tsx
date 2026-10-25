import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addDays } from "@/lib/dates";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { parseList } from "@/lib/json";
import { MARKET_LIMITS, WANTED_STATUS } from "@/lib/constants";
import { date } from "@/lib/format";
import { Notice, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash } from "@/components/market/Flash";
import { ReportForm } from "@/components/market/ReportForm";
import { budgetText } from "@/components/market/WantedCard";
import { countryName } from "@/components/market/labels";
import { respondWantedAction } from "../../_actions/conversations";
import { wantedOpAction } from "../../_actions/wanted";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await db.wantedPost.findUnique({ where: { id }, select: { title: true } });
  return { title: w?.title ?? "求租" };
}

function Op({ id, op, label, cls = "btn-outline btn-sm" }: { id: string; op: string; label: string; cls?: string }) {
  return (
    <form action={wantedOpAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <SubmitButton className={cls} pendingText="…">{label}</SubmitButton>
    </form>
  );
}

export default async function WantedDetail({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await expireStaleMarket();
  const [w, user] = await Promise.all([
    db.wantedPost.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, createdAt: true } }, _count: { select: { responses: true } } } }),
    getCurrentUser(),
  ]);
  if (!w) notFound();
  const isOwner = user?.id === w.userId;
  if (w.status === "HIDDEN" && !isOwner && user?.role !== "ADMIN") notFound();

  const back = `/market/wanted/${id}`;
  const remote = parseList(w.remoteMethods);
  const now = new Date();
  const [myResponse, myListings, responses] = await Promise.all([
    user && !isOwner ? db.inquiry.findFirst({ where: { wantedId: id, hostId: user.id }, select: { id: true } }) : null,
    user && !isOwner ? db.listing.findMany({ where: { hostId: user.id, status: "PUBLISHED" }, select: { id: true, title: true } }) : [],
    isOwner
      ? db.inquiry.findMany({
          where: { wantedId: id },
          orderBy: { createdAt: "desc" },
          include: { host: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" }, take: 1 } },
        })
      : [],
  ]);
  const full = w._count.responses >= MARKET_LIMITS.wantedMaxResponses;

  let respondBox;
  if (isOwner) respondBox = null;
  else if (myResponse) respondBox = <Link href={`/market/messages/${myResponse.id}`} className="btn-primary w-full">查看我的回应</Link>;
  else if (w.status !== "OPEN") respondBox = <p className="text-sm text-muted">这条求租已不在征集中。</p>;
  else if (full) respondBox = <p className="text-sm text-muted">回应已满（{MARKET_LIMITS.wantedMaxResponses} 位），不再接受新回应。</p>;
  else if (!user) respondBox = <Link href={`/login?next=${encodeURIComponent(back)}`} className="btn-primary w-full">登录后回应</Link>;
  else if (myListings.length === 0) {
    respondBox = (
      <p className="text-sm text-ink-soft">
        回应求租需要你至少有一个发布中的方案。<Link href="/market/publish" className="text-brand hover:underline">先发布方案</Link>
      </p>
    );
  } else {
    respondBox = (
      <form action={respondWantedAction} className="space-y-3">
        <input type="hidden" name="wantedId" value={id} />
        <label className="block">
          <span className="label">附上你的方案</span>
          <select name="listingId" className="input">
            {myListings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">回应内容 *</span>
          <textarea name="body" required minLength={5} maxLength={1000} rows={4} className="input" placeholder="说明你的机器哪里符合需求、价格和交付方式" />
        </label>
        <SubmitButton className="btn-primary w-full" pendingText="发送中…">回应求租</SubmitButton>
        <p className="text-xs text-muted">每天最多回应 {MARKET_LIMITS.wantedHostDailyResponses} 条求租。</p>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/market/wanted" className="text-sm text-muted hover:text-brand">← 返回求租</Link>
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge map={WANTED_STATUS} value={w.status} />
              <span className="text-xs text-muted">{w.user.name} · {date(w.createdAt)} 发布 · 已有 {w._count.responses} 位房东回应（上限 {MARKET_LIMITS.wantedMaxResponses}）</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold">{w.title}</h1>
            <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {[
                ["用途", w.purpose],
                ["预算", budgetText(w)],
                ["最低芯片", w.chipMin ?? "不限"],
                ["最低内存", w.memMin ? `${w.memMin}GB` : "不限"],
                ["管理员权限", w.adminNeeded ? "需要" : "不强制"],
                ["远程方式", remote.length ? remote.join(" / ") : "不限"],
                ["地区", [countryName(w.country) || "不限", w.region].filter(Boolean).join(" ")],
                ["开始 / 租期", `${w.startDate ? date(w.startDate) : "时间灵活"} · ${w.termMonths} 个月`],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-muted">{k}</dt><dd className="mt-0.5">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-7 text-ink-soft">{w.description}</p>
          </div>

          {isOwner && (
            <div className="card p-5">
              <h2 className="font-semibold">管理这条求租</h2>
              <p className="mt-1 text-xs text-muted">{w.status === "OPEN" && `${date(w.expiresAt)} 到期，到期前 ${MARKET_LIMITS.listingConfirmWindowDays} 天内可确认续期。`}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {w.status === "OPEN" && <Op id={id} op="fill" label="已租到" cls="btn-safe btn-sm" />}
                {(w.status === "OPEN" || w.status === "EXPIRED") && <Op id={id} op="close" label="关闭" cls="btn-danger btn-sm" />}
                {((w.status === "OPEN" && w.expiresAt <= addDays(now, MARKET_LIMITS.listingConfirmWindowDays)) || w.status === "EXPIRED") && (
                  <Op id={id} op="confirm" label={w.status === "EXPIRED" ? "重新开放" : "确认仍在找"} />
                )}
                {(w.status === "CLOSED" || w.status === "FILLED") && w.closedAt && w.closedAt > addDays(now, -MARKET_LIMITS.wantedReopenDays) && (
                  <Op id={id} op="reopen" label="重新开放" />
                )}
              </div>
              <h3 className="mt-5 text-sm font-semibold">收到的回应（{responses.length}）</h3>
              {responses.length === 0 ? (
                <p className="mt-2 text-sm text-muted">还没有房东回应。</p>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {responses.map((r) => (
                    <li key={r.id}>
                      <Link href={`/market/messages/${r.id}`} className="block py-2.5 text-sm hover:text-brand">
                        <span className="font-medium">{r.host.name}</span>
                        <span className="ml-2 text-muted">{r.messages[0]?.body.slice(0, 60)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!isOwner && (
            <div className="flex justify-end"><ReportForm targetType="WANTED" targetId={id} returnTo={back} loggedIn={!!user} label="举报这条求租" /></div>
          )}
        </div>
        <aside className="space-y-4">
          {respondBox && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">我有合适的机器</h2>
              {respondBox}
            </div>
          )}
          <Notice tone="warn">求租方不付任何费用给平台。房东回应后在站内沟通，平台不经手租金，不要大额预付。</Notice>
        </aside>
      </div>
    </div>
  );
}
