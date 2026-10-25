import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { trackView } from "@/lib/track";
import { ADMIN_ACCESS, DEVICE_MODELS } from "@/lib/constants";
import { date } from "@/lib/format";
import { Empty, Notice, Pager } from "@/components/ui";
import { ListingCard } from "@/components/market/ListingCard";

export const metadata = { title: "找远程 Mac · 租赁市场" };

const PAGE_SIZE = 20;

type SP = {
  q?: string; model?: string; mem?: string; admin?: string; cur?: string; max?: string; sort?: string; page?: string;
};

export default async function MarketPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await trackView("/market");

  const where: Prisma.ListingWhereInput = { status: "PUBLISHED" };
  const q = sp.q?.trim();
  if (q) {
    where.OR = ["title", "city", "region", "country", "deviceModel"].map((f) => ({ [f]: { contains: q } }));
  }
  if (sp.model && DEVICE_MODELS.includes(sp.model)) where.deviceModel = sp.model;
  const mem = Number(sp.mem);
  if (mem > 0) where.memory = { gte: mem };
  if (sp.admin && sp.admin in ADMIN_ACCESS) where.adminAccess = sp.admin;
  if (sp.cur === "USD" || sp.cur === "CNY") where.currency = sp.cur;
  const max = Number(sp.max);
  if (max > 0) where.price = { lte: max };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sp.sort === "price_asc" ? { price: "asc" } : sp.sort === "price_desc" ? { price: "desc" } : { confirmedAt: "desc" };

  const page = Math.max(1, Number(sp.page) || 1);
  const since = date(new Date(Date.now() - 30 * 86400000));
  const [total, listings, publishedCount, views] = await Promise.all([
    db.listing.count({ where }),
    db.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { host: { select: { name: true, hostStatus: true } } },
    }),
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.pageView.aggregate({ _sum: { count: true }, where: { path: { startsWith: "/market" }, day: { gte: since } } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Object.entries(sp).some(([k, v]) => k !== "page" && k !== "sort" && v);

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
          对比配置、地区和出租条件，在站内直接问房东。付款前先看看
          <Link href="/market/community" className="text-brand hover:underline">租之前要问清楚的问题</Link>；
          有闲置 Mac？<Link href="/market/become-host" className="text-brand hover:underline">了解怎么出租</Link>。
        </p>
        <p className="mt-2 text-xs text-muted">
          近 30 天浏览 {(views._sum.count ?? 0).toLocaleString()} 次 · 发布中的方案 {publishedCount} 个
        </p>
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" method="get">
        <label className="sm:col-span-2">
          <span className="label">关键词</span>
          <input name="q" defaultValue={sp.q} className="input" placeholder="城市、国家、型号，如 西雅图 / M4" />
        </label>
        <label>
          <span className="label">设备型号</span>
          <select name="model" defaultValue={sp.model ?? ""} className="input">
            <option value="">不限</option>
            {DEVICE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          <span className="label">内存不低于</span>
          <select name="mem" defaultValue={sp.mem ?? ""} className="input">
            <option value="">不限</option>
            {[8, 16, 24, 32].map((m) => <option key={m} value={m}>{m}GB</option>)}
          </select>
        </label>
        <label>
          <span className="label">权限</span>
          <select name="admin" defaultValue={sp.admin ?? ""} className="input">
            <option value="">不限</option>
            {Object.entries(ADMIN_ACCESS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          <span className="label">币种</span>
          <select name="cur" defaultValue={sp.cur ?? ""} className="input">
            <option value="">不限</option>
            <option value="USD">美元</option>
            <option value="CNY">人民币</option>
          </select>
        </label>
        <label>
          <span className="label">月租不高于</span>
          <input name="max" type="number" min={1} defaultValue={sp.max} className="input" placeholder="按所选币种" />
        </label>
        <label>
          <span className="label">排序</span>
          <select name="sort" defaultValue={sp.sort ?? ""} className="input">
            <option value="">最近确认</option>
            <option value="price_asc">价格低 → 高</option>
            <option value="price_desc">价格高 → 低</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
          {filtered && <Link href="/market" className="btn-ghost">清除筛选</Link>}
          <button className="btn-primary" type="submit">搜索</button>
        </div>
      </form>

      <Notice tone="warn">
        <strong className="font-semibold">以下方案由第三方房东发布。</strong>
        GetMac 不核验设备、不经手租金，也不对交付和售后负责；方案内容由房东自行填写。
        付款前请在站内问清配置和交付方式；第一次合作建议按月付，不要大额预付。
      </Notice>

      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">出租方案</h2>
        <span className="text-sm text-muted">共 {total} 条{filtered ? "符合条件" : "可咨询"}的方案</span>
      </div>

      {listings.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <Empty>
          没有符合条件的方案。可以放宽筛选，或者
          <Link href="/market/wanted" className="text-brand hover:underline">发一条求租</Link>，让房东来找你。
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
