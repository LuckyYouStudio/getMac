import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { trackView } from "@/lib/track";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { ADMIN_ACCESS, AVAILABILITY, CHIPS, COUNTRIES, MEMORY_OPTIONS, NETWORK, chipRank } from "@/lib/constants";
import { date } from "@/lib/format";
import { Empty, Notice, Pager } from "@/components/ui";
import { ListingCard } from "@/components/market/ListingCard";

export const metadata = { title: "找远程 Mac · 租赁市场" };

const PAGE_SIZE = 20;

type SP = {
  q?: string; country?: string; region?: string; chip_min?: string; mem_min?: string; price_min?: string; price_max?: string;
  admin?: string; network?: string; avail?: string; sort?: string; page?: string; more?: string;
};

export default async function MarketPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await Promise.all([trackView("/market"), expireStaleMarket()]);

  const and: Prisma.ListingWhereInput[] = [{ status: "PUBLISHED" }];
  const q = sp.q?.trim();
  if (q) and.push({ OR: ["title", "city", "region", "machineType", "chip", "description"].map((f) => ({ [f]: { contains: q } })) });
  if (sp.country && sp.country in COUNTRIES) and.push({ country: sp.country });
  const region = sp.region?.trim();
  if (region) and.push({ OR: [{ region: { contains: region } }, { city: { contains: region } }] });
  const rank = chipRank(sp.chip_min);
  if (rank >= 0) and.push({ chip: { in: CHIPS.slice(rank) } });
  const mem = Number(sp.mem_min);
  if (mem > 0) and.push({ memory: { gte: mem } });
  // 价格区间只对美元方案生效，避免把美元和人民币数字直接比较
  const pmin = Number(sp.price_min);
  const pmax = Number(sp.price_max);
  if (pmin > 0 || pmax > 0) {
    and.push({ currency: "USD", price: { ...(pmin > 0 ? { gte: pmin } : {}), ...(pmax > 0 ? { lte: pmax } : {}) } });
  }
  if (sp.admin === "ANY") and.push({ adminAccess: { in: ["YES", "NEGOTIABLE"] } });
  else if (sp.admin && sp.admin in ADMIN_ACCESS) and.push({ adminAccess: sp.admin });
  if (sp.network && sp.network in NETWORK) and.push({ network: sp.network });
  if (sp.avail && sp.avail in AVAILABILITY) and.push({ availability: sp.avail });
  const where: Prisma.ListingWhereInput = { AND: and };

  // 默认：可咨询的排前面，再按最近确认
  const orderBy: Prisma.ListingOrderByWithRelationInput[] =
    sp.sort === "price_asc" ? [{ currency: "desc" }, { price: "asc" }]
      : sp.sort === "newest" ? [{ publishedAt: "desc" }]
        : [{ availability: "asc" }, { confirmedAt: "desc" }];

  const page = Math.max(1, Number(sp.page) || 1);
  const since = date(new Date(Date.now() - 30 * 86400000));
  const [total, listings, publishedCount, views] = await Promise.all([
    db.listing.count({ where }),
    db.listing.findMany({
      where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { host: { select: { name: true } } },
    }),
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.pageView.aggregate({ _sum: { count: true }, where: { path: { startsWith: "/market" }, day: { gte: since } } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Object.entries(sp).some(([k, v]) => !["page", "sort", "more"].includes(k) && v);
  const moreOpen = sp.more === "1" || ["chip_min", "price_min", "price_max", "admin", "network", "avail", "region"].some((k) => sp[k as keyof SP]);

  const href = (p: number) => {
    const params = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    params.set("page", String(p));
    return `/market?${params}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">找远程 Mac</h1>
        <p className="mt-1 text-sm text-ink-soft">
          比较配置、地区和出租条件，在站内直接问房东。联系之前，可以先读
          <Link href="/guides/questions-before-renting" className="text-brand hover:underline">租之前要问清楚的问题</Link>。
          家里有闲置的 Mac？<Link href="/market/become-host" className="text-brand hover:underline">看看怎么出租</Link>。
        </p>
        <p className="mt-2 text-xs text-muted">
          近 30 天浏览 {(views._sum.count ?? 0).toLocaleString()} 次 · 有效方案 {publishedCount} 个
        </p>
      </div>

      <form className="card space-y-3 p-4" method="get">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2">
            <span className="label">关键词</span>
            <input name="q" defaultValue={sp.q} className="input" placeholder="城市、型号、芯片，如 西雅图 / M4" />
          </label>
          <label>
            <span className="label">国家/地区</span>
            <select name="country" defaultValue={sp.country ?? ""} className="input">
              <option value="">不限</option>
              {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            <span className="label">内存不低于</span>
            <select name="mem_min" defaultValue={sp.mem_min ?? ""} className="input">
              <option value="">不限</option>
              {MEMORY_OPTIONS.map((m) => <option key={m} value={m}>{m}GB</option>)}
            </select>
          </label>
        </div>
        <details open={moreOpen} className="group">
          <summary className="cursor-pointer list-none text-sm text-brand">
            <span className="group-open:hidden">更多筛选 ▾</span>
            <span className="hidden group-open:inline">收起筛选 ▴</span>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="label">州/省/城市</span>
              <input name="region" defaultValue={sp.region} className="input" placeholder="如 加利福尼亚 / 东京" />
            </label>
            <label>
              <span className="label">芯片不低于</span>
              <select name="chip_min" defaultValue={sp.chip_min ?? ""} className="input">
                <option value="">不限</option>
                {CHIPS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span className="label">管理员权限</span>
              <select name="admin" defaultValue={sp.admin ?? ""} className="input">
                <option value="">不限</option>
                <option value="ANY">提供或可商议</option>
                {Object.entries(ADMIN_ACCESS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>
              <span className="label">网络</span>
              <select name="network" defaultValue={sp.network ?? ""} className="input">
                <option value="">不限</option>
                {Object.entries(NETWORK).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>
              <span className="label">档期</span>
              <select name="avail" defaultValue={sp.avail ?? ""} className="input">
                <option value="">不限</option>
                {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2">
              <span className="label">月租区间（美元）</span>
              <div className="flex items-center gap-2">
                <input name="price_min" type="number" min={1} defaultValue={sp.price_min} className="input" placeholder="最低" />
                <span className="text-muted">–</span>
                <input name="price_max" type="number" min={1} defaultValue={sp.price_max} className="input" placeholder="最高" />
              </div>
              <span className="hint block">只筛选以美元标价的方案，人民币方案会被排除。</span>
            </div>
          </div>
        </details>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">排序</span>
            <select name="sort" defaultValue={sp.sort ?? ""} className="input w-auto">
              <option value="">默认（可咨询优先）</option>
              <option value="price_asc">价格从低到高</option>
              <option value="newest">最新发布</option>
            </select>
          </label>
          <div className="flex gap-2">
            {filtered && <Link href="/market" className="btn-ghost">清除筛选</Link>}
            <button className="btn-primary" type="submit">搜索</button>
          </div>
        </div>
      </form>

      <Notice tone="warn">
        <strong className="font-semibold">以下方案由第三方房东自行发布。</strong>
        GetMac 不核验房东身份和设备、不经手租金，也不对交付和售后负责。付款前请在站内问清配置与交付方式；第一次合作建议按月付，不要大额预付。
        详见<Link href="/market/rules#role" className="underline">市场规则</Link>。
      </Notice>

      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">出租方案</h2>
        <span className="text-sm text-muted">共 {total} 条{filtered ? "符合条件" : ""}</span>
      </div>

      {listings.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <Empty>
          没有符合条件的方案。可以放宽筛选，或者
          <Link href="/market/wanted/new" className="text-brand hover:underline">发一条求租</Link>，让房东来找你。
        </Empty>
      )}
      <Pager page={page} totalPages={totalPages} href={href} />

      <section className="card mt-10 flex flex-wrap items-center justify-between gap-4 border-brand/20 bg-brand-soft/60 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-navy px-1.5 py-0.5 text-xs font-medium text-white">GetMac 自营</span>
            <h2 className="font-semibold">想要平台直接提供、有人照看的机器？</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            这是本站自营服务，与本站存在商业关系，不在上面的第三方结果中。价格、开通和售后按自营方案执行。
          </p>
        </div>
        <Link href="/pricing" className="btn-primary">查看自营方案与价格</Link>
      </section>
    </div>
  );
}
