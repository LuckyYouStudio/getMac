import Link from "next/link";
import { db } from "@/lib/db";
import { expireStaleMarket } from "@/lib/market-lifecycle";
import { MARKET_LIMITS } from "@/lib/constants";
import { CheckIcon, Notice } from "@/components/ui";
import { WantedCard } from "@/components/market/WantedCard";

export const metadata = { title: "在市场出租你的 Mac" };

const STEPS = [
  ["登录后发布方案", "填 6 步：配置、地点与网络、使用条件、费用、服务约定、确认。免费，不抽成。"],
  ["方案立即公开", "发布后马上出现在“找设备”里，平台事后复查。需要修改时会告诉你原因。"],
  ["在站内回答租客", "租客会带着用途、开始时间和租期来问你。回复租客也会让方案自动续期。"],
  ["谈妥后双方确认成交", "付款和交付由你们自己约定。确认成交后可以互相评价，记录会显示在你的主页上。"],
];

const REQUIREMENTS = [
  "整台机器只给一位租客独占使用，按月起租，不做共享账号或按小时出租",
  "符合 macOS 软件许可，不出租你无权出租的设备",
  "标题、描述等公开内容里不留任何联系方式，联系一律走站内对话",
  `每个账号最多同时 ${MARKET_LIMITS.maxActiveListings} 个有效方案，每 ${MARKET_LIMITS.listingTtlDays} 天确认一次仍可租`,
  "不代开、不转售任何第三方账号或网络服务",
];

const DOES = ["展示你的方案，提供站内对话", "复查方案内容，处理举报", "记录双方确认的成交和评价"];
const DOES_NOT = ["不核验你的身份和设备", "不经手租金，不担保交付", "不替你处理与租客之间的纠纷赔偿"];

const FAQ = [
  ["发布要钱吗？", "不要。市场不收发布费，也不从租金里抽成。"],
  ["要先认证才能发吗？", "不用。登录后就能发布，方案立即公开，平台之后复查。"],
  ["方案为什么会过期？", `为了让租客看到的都是真的还能租的机器，方案每 ${MARKET_LIMITS.listingTtlDays} 天要确认一次。到期前 ${MARKET_LIMITS.listingConfirmWindowDays} 天内可以在“我的方案”里确认，回复租客或修改方案也会自动续期。`],
  ["暂时租出去了怎么办？", "把档期改成“暂无空位”或“预计某日起”，或者暂停咨询。已有的对话不受影响。"],
  ["租客不付款或者拖欠怎么办？", "平台不经手租金，建议首期按月预付、交付前收款。遇到骗子请在对话里举报。"],
  ["和“官方房东”有什么区别？", "市场房东自己找租客、自己收款、自己售后。官方房东把机器交给 GetMac 运营，由我们负责找客户、收款和售后，按月给你分成。"],
];

export default async function BecomeHostPage() {
  await expireStaleMarket();
  const wanted = await db.wantedPost.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { user: { select: { name: true } }, _count: { select: { responses: true } } },
  });

  return (
    <div className="space-y-12">
      <section className="max-w-3xl">
        <p className="eyebrow">在租赁市场出租</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">家里闲着的 Mac，可以租给需要的人</h1>
        <p className="mt-3 leading-7 text-ink-soft">
          免费发布，自己定价，自己和租客沟通。平台负责展示和站内对话，不经手租金。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/market/publish" className="btn-primary">发布出租方案</Link>
          <Link href="/guides/hosting-checklist" className="btn-outline">出租前准备清单</Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">怎么出租</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card p-5">
              <span className="text-sm font-semibold text-safe">0{i + 1}</span>
              <h3 className="mt-1 font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">出租的基本要求</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {REQUIREMENTS.map((r) => <li key={r} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-safe" />{r}</li>)}
          </ul>
          <Link href="/market/rules" className="mt-3 inline-block text-sm text-brand hover:underline">完整市场规则 →</Link>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">出租前先做好安全设置</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {[
              "给租客单独建一个账号，你自己的数据移到外接盘或另一台机器",
              "关掉“查找”，退出你自己的 Apple ID 和 iCloud",
              "打开防火墙，路由器上最好把这台机器放进单独的网段",
              "接 UPS，设置断电来电自动开机、永不睡眠",
            ].map((r) => <li key={r} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-safe" />{r}</li>)}
          </ul>
          <Link href="/guides/host-setup" className="mt-3 inline-block text-sm text-brand hover:underline">一步步设置 →</Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-safe">平台会做的</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">{DOES.map((d) => <li key={d}>· {d}</li>)}</ul>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-warn">平台不做的</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">{DOES_NOT.map((d) => <li key={d}>· {d}</li>)}</ul>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">现在有人在找机器</h2>
          <Link href="/market/wanted" className="text-sm text-brand hover:underline">全部求租 →</Link>
        </div>
        {wanted.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">{wanted.map((w) => <WantedCard key={w.id} w={w} />)}</div>
        ) : (
          <p className="mt-3 text-sm text-muted">暂时没有征集中的求租。</p>
        )}
        <p className="mt-3 text-xs text-muted">发布方案后，你就可以在求租详情页直接回应。</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">常见问题</h2>
        <div className="mt-4 space-y-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card group p-4">
              <summary className="cursor-pointer list-none font-medium">{q}</summary>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Notice tone="info">
        不想自己找租客、收款和售后？可以了解<Link href="/join" className="mx-1 font-semibold underline">官方房东计划</Link>，把机器交给 GetMac 运营，按月分成。
      </Notice>
    </div>
  );
}
