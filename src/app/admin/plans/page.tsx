import { db } from "@/lib/db";
import { CYCLES, cycleTotal, type Cycle } from "@/lib/constants";
import { usd } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { savePlan } from "../actions/business";

export const metadata = { title: "方案管理" };

type PlanLike = {
  id?: string; slug?: string; name?: string; badge?: string | null; spec?: string; priceMonthly?: number;
  summary?: string; featured?: boolean; active?: boolean; sort?: number;
};

function PlanForm({ p, count }: { p: PlanLike; count?: number }) {
  return (
    <form action={savePlan} className="card space-y-3 p-5">
      <input type="hidden" name="id" value={p.id ?? ""} />
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{p.id ? p.name : "新增方案"}</h2>
        <div className="flex gap-1.5">
          {p.featured && <Badge tone="info">推荐</Badge>}
          {p.id && (p.active ? <Badge tone="ok">上架</Badge> : <Badge>下架</Badge>)}
          {count !== undefined && <Badge>{count} 台设备</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block"><span className="label">名称</span><input name="name" className="input" required defaultValue={p.name} /></label>
        <label className="block"><span className="label">标识</span><input name="slug" className="input" required pattern="[a-z0-9-]+" defaultValue={p.slug} /></label>
        <label className="block"><span className="label">角标</span><input name="badge" className="input" defaultValue={p.badge ?? ""} placeholder="推荐" /></label>
      </div>
      <label className="block"><span className="label">配置说明</span><input name="spec" className="input" required defaultValue={p.spec} /></label>
      <label className="block"><span className="label">适用场景</span><input name="summary" className="input" required defaultValue={p.summary} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">月价（USD）</span><input name="priceMonthly" type="number" min={1} className="input" required defaultValue={p.priceMonthly} /></label>
        <label className="block"><span className="label">排序</span><input name="sort" type="number" className="input" defaultValue={p.sort ?? 0} /></label>
      </div>
      {p.priceMonthly ? (
        <p className="text-xs text-muted">
          {(Object.keys(CYCLES) as Cycle[]).map((c) => `${CYCLES[c].label} ${usd(cycleTotal(p.priceMonthly!, c))}`).join(" · ")}
        </p>
      ) : null}
      <div className="flex gap-5 text-sm">
        <label className="flex items-center gap-1.5"><input type="checkbox" name="featured" defaultChecked={p.featured} /> 推荐档</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={p.active ?? true} /> 上架销售</label>
      </div>
      <SubmitButton className="btn-primary">{p.id ? "保存" : "创建方案"}</SubmitButton>
    </form>
  );
}

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const plans = await db.plan.findMany({ include: { _count: { select: { machines: true } } }, orderBy: { sort: "asc" } });
  return (
    <div>
      <PageHeader title="自营方案" desc="修改后前台方案页即时生效。季付 95 折、年付 88 折自动计算。" />
      <ErrorBanner error={error} />
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => <PlanForm key={p.id} p={p} count={p._count.machines} />)}
        <PlanForm p={{}} />
      </div>
    </div>
  );
}
