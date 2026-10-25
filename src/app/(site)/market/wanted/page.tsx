import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { CHIPS, COUNTRIES, MARKET_LIMITS, MEMORY_OPTIONS, chipRank } from "@/lib/constants";
import { Empty, PageHeader } from "@/components/ui";
import { Flash } from "@/components/market/Flash";
import { WantedCard } from "@/components/market/WantedCard";

export const metadata = { title: "求租 · 租赁市场" };

type SP = { q?: string; chip?: string; mem?: string; budget?: string; country?: string; region?: string; sort?: string; ok?: string; err?: string };

export default async function WantedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await expireStaleMarket();

  const and: Prisma.WantedPostWhereInput[] = [{ status: "OPEN" }];
  const q = sp.q?.trim();
  if (q) and.push({ OR: [{ title: { contains: q } }, { purpose: { contains: q } }, { description: { contains: q } }] });
  // “我能提供的芯片/内存”：只显示要求不高于它的求租
  const rank = chipRank(sp.chip);
  if (rank >= 0) and.push({ OR: [{ chipMin: null }, { chipMin: { in: CHIPS.slice(0, rank + 1) } }] });
  const mem = Number(sp.mem);
  if (mem > 0) and.push({ OR: [{ memMin: null }, { memMin: { lte: mem } }] });
  const budget = Number(sp.budget);
  if (budget > 0) and.push({ OR: [{ budgetMax: { gte: budget } }, { budgetMax: null, budgetMin: { gte: budget } }] });
  if (sp.country && sp.country in COUNTRIES) and.push({ OR: [{ country: sp.country }, { country: null }] });
  if (sp.region?.trim()) and.push({ region: { contains: sp.region.trim() } });

  const orderBy: Prisma.WantedPostOrderByWithRelationInput[] =
    sp.sort === "budget" ? [{ budgetMax: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] : [{ createdAt: "desc" }];

  const include = { user: { select: { name: true } }, _count: { select: { responses: true } } } as const;
  const [open, history] = await Promise.all([
    db.wantedPost.findMany({ where: { AND: and }, orderBy, include, take: 50 }),
    db.wantedPost.findMany({ where: { status: { in: ["FILLED", "CLOSED", "EXPIRED"] } }, orderBy: { createdAt: "desc" }, include, take: 12 }),
  ]);
  const filtered = ["q", "chip", "mem", "budget", "country", "region"].some((k) => sp[k as keyof SP]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="求租"
        desc={`说出你要什么配置、在哪、预算多少，有空位的房东会在站内回应你。每人最多同时 ${MARKET_LIMITS.maxActiveWanted} 条，${MARKET_LIMITS.wantedTtlDays} 天确认一次。`}
        actions={<Link href="/market/wanted/new" className="btn-primary">发布求租</Link>}
      />
      <Flash ok={sp.ok} err={sp.err} />

      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2">
          <span className="label">关键词</span>
          <input name="q" defaultValue={sp.q} className="input" placeholder="用途、配置…" />
        </label>
        <label>
          <span className="label">我能提供的芯片</span>
          <select name="chip" defaultValue={sp.chip ?? ""} className="input">
            <option value="">不限</option>
            {CHIPS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span className="label">我能提供的内存</span>
          <select name="mem" defaultValue={sp.mem ?? ""} className="input">
            <option value="">不限</option>
            {MEMORY_OPTIONS.map((m) => <option key={m} value={m}>{m}GB</option>)}
          </select>
        </label>
        <label>
          <span className="label">预算不低于（USD/月）</span>
          <input name="budget" type="number" min={1} defaultValue={sp.budget} className="input" />
        </label>
        <label>
          <span className="label">国家/地区</span>
          <select name="country" defaultValue={sp.country ?? ""} className="input">
            <option value="">不限</option>
            {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          <span className="label">州/省</span>
          <input name="region" defaultValue={sp.region} className="input" />
        </label>
        <label>
          <span className="label">排序</span>
          <select name="sort" defaultValue={sp.sort ?? ""} className="input">
            <option value="">最新发布</option>
            <option value="budget">预算从高到低</option>
          </select>
        </label>
        <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-4">
          {filtered && <Link href="/market/wanted" className="btn-ghost">清除筛选</Link>}
          <button className="btn-primary">筛选</button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 font-semibold">征集中（{open.length}）</h2>
        {open.length ? (
          <div className="grid gap-4 md:grid-cols-2">{open.map((w) => <WantedCard key={w.id} w={w} />)}</div>
        ) : (
          <Empty>暂时没有符合条件的求租。</Empty>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-ink-soft">历史求租</h2>
          <div className="grid gap-4 opacity-80 md:grid-cols-2">{history.map((w) => <WantedCard key={w.id} w={w} />)}</div>
        </section>
      )}
    </div>
  );
}
