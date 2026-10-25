import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { CYCLES, cycleTotal, savingPct, type Cycle } from "@/lib/constants";
import { usd } from "@/lib/format";
import { parseList } from "@/lib/json";
import { availableByPlan } from "@/lib/reservations";
import { Badge, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { savePlan } from "../actions/business";

export const metadata = { title: "方案管理" };

function PlanForm({ p, machines, free }: { p: Partial<Plan>; machines?: number; free?: number }) {
  const hasPrices = !!(p.priceMonth && p.priceQuarter && p.priceYear);
  return (
    <form action={savePlan} className="card space-y-3 p-5">
      <input type="hidden" name="id" value={p.id ?? ""} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{p.id ? p.name : "新增方案"}</h2>
        <div className="flex flex-wrap gap-1.5">
          {p.featured && <Badge tone="info">推荐</Badge>}
          {p.id && (p.active ? <Badge tone="ok">上架</Badge> : <Badge>下架</Badge>)}
          {machines !== undefined && <Badge>{machines} 台设备</Badge>}
          {free !== undefined && <Badge tone={free ? "ok" : "danger"}>{free ? `空闲 ${free}` : "缺货"}</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block"><span className="label">名称</span><input name="name" className="input" required defaultValue={p.name} /></label>
        <label className="block"><span className="label">标识</span><input name="slug" className="input" required pattern="[a-z0-9-]+" defaultValue={p.slug} /></label>
        <label className="block"><span className="label">角标</span><input name="badge" className="input" defaultValue={p.badge ?? ""} placeholder="推荐" /></label>
      </div>
      <label className="block"><span className="label">配置说明</span><input name="spec" className="input" required defaultValue={p.spec} /></label>
      <label className="block"><span className="label">适用场景</span><input name="summary" className="input" required defaultValue={p.summary} /></label>

      <fieldset className="rounded-lg bg-surface-2 p-3">
        <legend className="px-1 text-xs font-medium text-ink-soft">月均价（USD），三个周期分别定价</legend>
        <div className="grid grid-cols-3 gap-3">
          <label className="block"><span className="label">月付</span><input name="priceMonth" type="number" min={1} className="input" required defaultValue={p.priceMonth} /></label>
          <label className="block"><span className="label">季付</span><input name="priceQuarter" type="number" min={1} className="input" required defaultValue={p.priceQuarter} /></label>
          <label className="block"><span className="label">年付</span><input name="priceYear" type="number" min={1} className="input" required defaultValue={p.priceYear} /></label>
        </div>
        {hasPrices && (
          <p className="mt-2 text-xs text-muted">
            {(Object.keys(CYCLES) as Cycle[])
              .map((c) => {
                const s = savingPct(p as Plan, c);
                return `${CYCLES[c].label}预付 ${usd(cycleTotal(p as Plan, c))}${s > 0 ? `（省 ${s}%）` : ""}`;
              })
              .join(" · ")}
          </p>
        )}
      </fieldset>

      <label className="block">
        <span className="label">本档权益（每行一条）</span>
        <textarea name="features" rows={4} className="input" defaultValue={parseList(p.features).join("\n")} placeholder={"上一档全部内容\n工单 12 小时内回复"} />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block"><span className="label">回复时效（小时）</span><input name="responseHours" type="number" min={1} className="input" defaultValue={p.responseHours ?? 24} /></label>
        <label className="block"><span className="label">建议人数</span><input name="seats" className="input" defaultValue={p.seats ?? "1 人"} /></label>
        <label className="block"><span className="label">Xcode 流畅度</span><input name="xcodeLevel" className="input" defaultValue={p.xcodeLevel ?? "可用"} /></label>
        <label className="block"><span className="label">排序</span><input name="sort" type="number" className="input" defaultValue={p.sort ?? 0} /></label>
      </div>
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
  const [plans, free] = await Promise.all([
    db.plan.findMany({ include: { _count: { select: { machines: true } } }, orderBy: { sort: "asc" } }),
    availableByPlan(),
  ]);
  return (
    <div>
      <PageHeader title="自营方案" desc="修改后前台方案页即时生效。三个周期都填月均价，预付总价 = 月均价 × 月数。" />
      <ErrorBanner error={error} />
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => <PlanForm key={p.id} p={p} machines={p._count.machines} free={free.get(p.id) ?? 0} />)}
        <PlanForm p={{}} />
      </div>
    </div>
  );
}
