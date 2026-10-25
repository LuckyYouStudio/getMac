import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CYCLES, OFFICIAL_HOST_FEE, planMonthly, type Cycle } from "@/lib/constants";
import { CheckIcon, FormError, ShieldIcon } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { EarningsCalculator } from "@/components/official/EarningsCalculator";
import { joinOfficialHostAction } from "./actions";

export const metadata = { title: "成为官方房东" };

const YOU = [
  "提供一台属于你的 Mac mini，放在美国的家里或办公室",
  "保持通电和有线网络，接好 UPS",
  "机器卡死或断网时，按我们的请求在当地重启（通常 4 小时内）",
  "按清单完成初始设置，安装运维脚本",
];
const US = [
  "找租客、收款、开发票、处理退款",
  "交付、远程支持、日常答疑",
  "系统更新、账号开通与回收、到期抹盘",
  "监控在线状态，异常时第一时间通知你",
];
const STEPS = [
  { t: "注册并同意协议", d: "登录后在本页勾选同意《官方房东协议》，即刻开通房东后台，不需要审核资料。" },
  { t: "登记机器", d: "在房东后台填写芯片、内存、存储和所在城市，系统会给你一个运维令牌。" },
  { t: "完成上架清单", d: "按清单设置电源、网络和系统，装好心跳脚本，等首次心跳自动打勾。" },
  { t: "上架、出租、月结", d: "我们远程验收后上架。租出的月份按月结算，次月 10 日前打款。" },
];
const PREP = [
  "Apple 芯片的 Mac mini（M1 及以上），存储 256GB 起",
  "UPS 不间断电源",
  "有线宽带，上行 20M 以上，最好有公网 IPv4 或 IPv6",
  "一个不常挪动、通风良好的位置",
  "能收美元的账户（PayPal、Wise 或美国银行账户）",
];
const FAQ = [
  ["机器的所有权归谁？", "始终归你。你可以提前 30 天通知后退出，我们在租期结束后抹盘并移交。"],
  ["租客能看到我的家庭网络吗？", "租客只能通过远程工具进入这台机器。我们建议把它放在路由器的独立网段或访客网络里，清单里有说明。"],
  ["我能登录租客的环境吗？", "不能。出租期间你只负责电源和网络，不得进入租客的账号或查看文件，需要维护时由我们征得租客同意后处理。"],
  ["空置的月份要付服务费吗？", "不用。服务费只在机器租出的月份按台收取。"],
  ["电费和网费谁出？", "由你承担。Mac mini 待机功耗很低，一般每月电费在几美元以内。"],
  ["和在租赁市场自己出租有什么区别？", "市场里你自己定价、自己找租客、自己收款和售后；官方房东由我们统一定价和服务，你只管机器在线。"],
];

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [user, plans] = await Promise.all([
    getCurrentUser(),
    db.plan.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
  ]);
  const calcPlans = plans.map((p) => ({
    slug: p.slug, name: p.name, spec: p.spec, priceMonth: p.priceMonth, priceQuarter: p.priceQuarter, priceYear: p.priceYear,
  }));

  return (
    <div>
      {/* 首屏 */}
      <section className="border-b border-line bg-gradient-to-b from-brand-soft/60 to-bg">
        <div className="container-page py-16">
          <p className="eyebrow">官方房东计划</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-navy sm:text-4xl">
            家里那台闲着的 Mac mini，<br />交给我们出租。
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-ink-soft">
            你负责让它一直通电联网，我们负责找租客、收款、交付和售后。租出去的月份，扣掉每台每月 ${OFFICIAL_HOST_FEE} 的服务费，其余都归你。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#signup" className="btn-primary btn-lg">开通房东后台</a>
            <a href="#calc" className="btn-outline btn-lg">先算算能赚多少</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {["机器始终归你", "空置月份不收费", "次月 10 日前结算", "提前 30 天通知即可退出"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-safe-soft px-2.5 py-1 text-safe">
                <CheckIcon className="h-3.5 w-3.5" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 py-14">
        {/* 计算器 */}
        <section id="calc" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold text-navy">收益计算器</h2>
          <p className="mt-1 mb-5 text-sm text-muted">分成规则只有一条：客户实付 − 每台每月 ${OFFICIAL_HOST_FEE}。</p>
          <EarningsCalculator plans={calcPlans} />
        </section>

        {/* 分工 */}
        <section>
          <h2 className="text-2xl font-semibold text-navy">各管各的事</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[{ title: "你负责", items: YOU }, { title: "我们负责", items: US }].map((col) => (
              <div key={col.title} className="card p-6">
                <h3 className="font-semibold text-ink">{col.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {col.items.map((t) => (
                    <li key={t} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-safe" />{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 分成表 */}
        <section>
          <h2 className="text-2xl font-semibold text-navy">每档每月能分到多少</h2>
          <p className="mt-1 mb-5 text-sm text-muted">按客户所选周期的月均价计算，美元。</p>
          <div className="card overflow-x-auto">
            <table className="table min-w-[560px]">
              <thead>
                <tr>
                  <th>档位</th>
                  {(Object.keys(CYCLES) as Cycle[]).map((c) => <th key={c}>{CYCLES[c].label}：客户付 / 你得</th>)}
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium">{p.name}档</div>
                      <div className="text-xs text-muted">{p.spec}</div>
                    </td>
                    {(Object.keys(CYCLES) as Cycle[]).map((c) => {
                      const m = planMonthly(p, c);
                      const net = m - OFFICIAL_HOST_FEE;
                      return (
                        <td key={c}>
                          ${m} / <span className="font-semibold text-safe">${net}</span>
                          <span className="ml-1 text-xs text-muted">（{Math.round((net / m) * 100)}%）</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 流程 */}
        <section>
          <h2 className="text-2xl font-semibold text-navy">四步上架</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="card p-5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</div>
                <div className="mt-3 font-medium">{s.t}</div>
                <p className="mt-1 text-sm leading-6 text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 对比 */}
        <section>
          <h2 className="text-2xl font-semibold text-navy">官方房东和市场房东，选哪个</h2>
          <div className="card mt-5 overflow-x-auto">
            <table className="table min-w-[560px]">
              <thead>
                <tr><th></th><th>官方房东</th><th>市场房东</th></tr>
              </thead>
              <tbody>
                {[
                  ["定价", "GetMac 统一定价", "你自己定"],
                  ["找租客", "我们负责", "你自己在市场发布"],
                  ["收款", "我们收款，月结给你", "你和租客直接结算"],
                  ["售后与交付", "我们负责", "你自己负责"],
                  ["平台费用", `租出月份每台 $${OFFICIAL_HOST_FEE}/月`, "免费发布"],
                  ["机器要求", "Mac mini，放在美国，24 小时在线", "不限型号和地区"],
                ].map(([k, a, b]) => (
                  <tr key={k}><td className="text-muted">{k}</td><td>{a}</td><td>{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            想自己定价、自己找租客？去<Link href="/market/become-host" className="text-brand hover:underline">租赁市场出租</Link>。
          </p>
        </section>

        {/* 准备清单 + FAQ */}
        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-navy">开始之前准备好</h2>
            <ul className="card mt-5 space-y-3 p-6 text-sm text-ink-soft">
              {PREP.map((t) => (
                <li key={t} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-safe" />{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-navy">常见问题</h2>
            <div className="mt-5 space-y-2">
              {FAQ.map(([q, a]) => (
                <details key={q} className="card group p-4">
                  <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
                    <span className="mr-2 text-brand group-open:rotate-90">›</span>{q}
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 开通 */}
        <section id="signup" className="scroll-mt-24">
          <div className="card mx-auto max-w-xl p-8">
            <h2 className="text-xl font-semibold text-navy">开通房东后台</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-safe">
              <ShieldIcon className="h-3.5 w-3.5" />不需要上传证件，机器验收通过后才会上架
            </p>
            {!user ? (
              <div className="mt-6 space-y-3 text-sm text-ink-soft">
                <p>先登录或注册一个 GetMac 账号，回到这里勾选协议即可开通。</p>
                <div className="flex gap-2">
                  <Link href="/register?next=/join%23signup" className="btn-primary">注册账号</Link>
                  <Link href="/login?next=/join%23signup" className="btn-outline">已有账号，登录</Link>
                </div>
              </div>
            ) : user.officialHost ? (
              <div className="mt-6 space-y-3 text-sm text-ink-soft">
                <p>你已经是官方房东了。</p>
                <Link href="/ops" className="btn-primary">进入房东后台</Link>
              </div>
            ) : (
              <form action={joinOfficialHostAction} className="mt-6 space-y-4">
                <p className="text-sm text-ink-soft">以 <span className="font-medium text-ink">{user.email}</span> 开通。</p>
                <label className="flex items-start gap-2 text-sm text-ink-soft">
                  <input type="checkbox" name="agree" required className="mt-1" />
                  <span>
                    我已阅读并同意<Link href="/host-agreement" target="_blank" className="text-brand hover:underline">《官方房东协议》</Link>，
                    理解出租期间不得进入租客的环境。
                  </span>
                </label>
                <FormError message={error === "agree" ? "请先勾选同意协议" : null} />
                <SubmitButton>同意协议并开通</SubmitButton>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
