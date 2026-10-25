import Link from "next/link";
import { db } from "@/lib/db";
import { availableByPlan, releaseExpiredReservations } from "@/lib/reservations";
import { trackView } from "@/lib/track";
import {
  CYCLES, MAX_SEATS_PER_MACHINE, REFUND_WINDOW_HOURS, RESERVE_MINUTES, SITE,
  isCycle, minSaving, planMonthly, type Cycle,
} from "@/lib/constants";
import { usd } from "@/lib/format";
import { parseList } from "@/lib/json";
import { CheckIcon, Notice } from "@/components/ui";
import { CycleTabs, PlanCard } from "@/components/selfserve/PlanCard";

export const metadata = { title: "方案与价格" };
export const dynamic = "force-dynamic";

const CYCLE_KEYS = Object.keys(CYCLES) as Cycle[];

function hasFeature(features: string, word: string) {
  return parseList(features).some((f) => f.includes(word));
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string; name?: string; notify?: string }>;
}) {
  await releaseExpiredReservations();
  await trackView("/pricing");
  const sp = await searchParams;
  const cycle: Cycle = isCycle(sp.cycle) ? sp.cycle : "QUARTER";
  const [plans, avail] = await Promise.all([
    db.plan.findMany({
      where: { active: true },
      orderBy: { sort: "asc" },
      include: { machines: { where: { status: { notIn: ["ONBOARDING", "RETIRED"] } }, select: { name: true, status: true } } },
    }),
    availableByPlan(),
  ]);
  const totalAvail = plans.reduce((n, p) => n + (avail.get(p.id) ?? 0), 0);
  const named = sp.name
    ? plans.flatMap((p) => p.machines.map((m) => ({ ...m, planSlug: p.slug, planName: p.name }))).find((m) => m.name === sp.name)
    : undefined;
  const savings = Object.fromEntries(CYCLE_KEYS.map((c) => [c, minSaving(plans, c)])) as Record<Cycle, number>;

  const href = (c: Cycle) => {
    const p = new URLSearchParams({ cycle: c });
    if (sp.name) p.set("name", sp.name);
    return `/pricing?${p}#plans`;
  };

  const compareRows: [string, (p: (typeof plans)[number]) => string][] = [
    ["芯片 / 内存 / 存储", (p) => p.spec],
    ["实体机独享", () => "✓"],
    ["完整管理员权限", () => "✓"],
    ["UU 远程交付", () => "✓"],
    ["开发环境预装", () => "✓"],
    ["建议人数", (p) => p.seats],
    ["Xcode / 模拟器", (p) => p.xcodeLevel],
    ["工单回复", (p) => `${p.responseHours} 小时内`],
    ["死机优先处理", (p) => (hasFeature(p.features, "优先") ? "✓" : "—")],
    ["每月健康检查", (p) => (hasFeature(p.features, "健康检查") ? "✓" : "—")],
    ...CYCLE_KEYS.map((c) => [`${CYCLES[c].label}（月均）`, (p: (typeof plans)[number]) => usd(planMonthly(p, c))] as [string, (p: (typeof plans)[number]) => string]),
    ["现货", (p) => ((avail.get(p.id) ?? 0) > 0 ? `${avail.get(p.id)} 台` : "暂时缺货")],
  ];

  return (
    <div className="container-page py-14">
      <div className="text-center">
        <div className="eyebrow">自营方案</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy">三种配置，付得越久越省。</h1>
        <p className="mt-3 text-ink-soft">不设押金 · 到期不续即停 · 美元计价，人民币为约数（1 USD ≈ ¥{SITE.usdToCny}）</p>
        <p className="mt-2 text-sm text-muted">
          当前现货 <b className="text-safe">{totalAvail}</b> 台 · 拿不准选哪档？<Link className="text-brand hover:underline" href="/apply">告诉我们你的用法 →</Link>
        </p>
      </div>

      <div id="plans" className="mt-10 flex scroll-mt-24 justify-center">
        <CycleTabs cycle={cycle} href={href} savings={savings} />
      </div>

      {sp.name && (
        <div className="mx-auto mt-6 max-w-xl">
          {named?.status === "AVAILABLE" ? (
            <Notice tone="ok">已为你预选机器名 <b>{named.name}</b>（{named.planName}档），在这一档点“立即开通”即可。</Notice>
          ) : (
            <Notice>{sp.name} 目前已租出。可以在同档挑另一台空闲的机器，或登记到货通知。</Notice>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            cycle={cycle}
            available={avail.get(p.id) ?? 0}
            name={named && named.planSlug === p.slug && named.status === "AVAILABLE" ? named.name : undefined}
            notify={sp.notify === p.slug}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        想要其他地区或配置？<Link className="text-brand hover:underline" href="/market">看看租赁市场</Link>
        <span className="mx-2">·</span>
        家里有闲置的 Mac mini？<Link className="text-brand hover:underline" href="/join">成为官方房东 →</Link>
      </p>

      {/* 定制配置 */}
      <section className="mt-16 grid gap-6 rounded-3xl bg-navy p-8 text-slate-200 md:grid-cols-[1.3fr_1fr] md:p-10">
        <div>
          <div className="text-xs tracking-widest text-emerald-300">定制配置</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">要更大的内存、更多台，或 Pro 芯片？</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            M5 Pro、M6 等芯片，内存和存储按需选择，可以一次配多台给整个团队。定制配置半年起租，单独报价，交付时间视到货情况而定。
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <ul className="space-y-2 text-sm">
            {["芯片、内存、存储自选", "多台统一管理，团队成员账号", "半年起租，单独报价"].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-emerald-400" />{t}</li>
            ))}
          </ul>
          <Link href="/apply?plan=custom" className="btn mt-2 bg-white text-navy hover:bg-slate-100">提交定制需求</Link>
        </div>
      </section>

      {/* 对比 */}
      <h2 className="mt-16 text-xl font-semibold text-navy">三档逐项对比</h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="table min-w-[640px]">
          <thead>
            <tr><th className="w-44" />{plans.map((p) => <th key={p.id}>{p.name}</th>)}</tr>
          </thead>
          <tbody>
            {compareRows.map(([label, fn]) => (
              <tr key={label}>
                <td className="text-muted">{label}</td>
                {plans.map((p) => <td key={p.id} className={fn(p) === "✓" ? "text-safe" : ""}>{fn(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 计费说明 */}
      <h2 id="billing" className="mt-16 scroll-mt-24 text-xl font-semibold text-navy">计费说明</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[
          ["从交付当天算起", "租期从交付连接信息的那一天开始，按自然月计算。例如 1 月 31 日交付的月付订单，到期日是 2 月 28 日（闰年 29 日）。"],
          ["周期各自定价", "月付、季付、年付各有单独的月均价，季付和年付在开通时一次付清整个周期。"],
          ["默认自动续费", "新订单默认开启自动续费，到期时按原周期续上同一台机器。你可以随时在订单页关闭，关闭后到期即停。"],
          ["付款方式", `支持银行卡和支付宝，由 Stripe 处理付款。信用卡账单上显示的商家名为 ${SITE.billingDescriptor}。`],
          ["不设押金", "没有押金、开通费或流量费。下单后机器为你保留 " + RESERVE_MINUTES + " 分钟，期间完成付款即可。"],
          ["随时升级", "可以从低一档升级到高一档，差价按当期剩余天数折算。升级通过联系我们办理。"],
          ["团队成员", `一台机器最多可以建 ${MAX_SEATS_PER_MACHINE} 个团队成员账号，所有人共用这台机器的性能。`],
          ["不含第三方订阅", "Apple 开发者账号、AI 编程工具、云服务等第三方订阅需要你自己注册和付费，不包含在租金里。"],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <div className="font-medium text-ink">{t}</div>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{d}</p>
          </div>
        ))}
      </div>

      <div id="refund" className="card mt-4 scroll-mt-24 p-6">
        <div className="font-medium text-ink">退款规则</div>
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink-soft">
          <li>· 交付前随时可以取消，全额退款。</li>
          <li>· 交付后 {REFUND_WINDOW_HOURS} 小时内，如果因为我们的原因始终无法正常使用，全额退款。</li>
          <li>· 自行提前停用的，剩余租期不退款；关闭自动续费即可在到期后停止。</li>
        </ul>
        <p className="mt-3 text-sm text-muted">完整条款见 <Link className="text-brand hover:underline" href="/terms#t5">服务条款 · 退款</Link> 与 <Link className="text-brand hover:underline" href="/terms#renewal">自动续费</Link>。</p>
      </div>
    </div>
  );
}
