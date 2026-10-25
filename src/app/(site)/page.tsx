import Link from "next/link";
import { db } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/reservations";
import { trackView } from "@/lib/track";
import { CITY_NAMES, SITE } from "@/lib/constants";
import { CheckIcon, ShieldIcon } from "@/components/ui";
import { ClockWidget } from "@/components/home/ClockWidget";
import { LatencyDemo } from "@/components/home/LatencyDemo";
import { PlanCard } from "@/components/selfserve/PlanCard";

export const dynamic = "force-dynamic";

const FEATURES = [
  { t: "实体机，独享", d: "从芯片到硬盘都只属于你的团队。没有邻居抢资源，也不会有陌生人登录同一台机器。" },
  { t: "完整的管理员权限", d: "开发需要的软件随你装、随你配。维护账号只按约定使用，并保留必要的操作记录。" },
  { t: "开机就能写代码", d: "Homebrew、Git、Node.js、Python、Xcode 命令行工具、tmux、mosh 均已预装，登录自己的账号即可开工。" },
  { t: "UU 远程一键交付", d: "交付时附上 UU 远程连接信息。想用 Tailscale 或 SSH，进入桌面后自己配置即可。" },
  { t: "纽约本地有人照看", d: "系统更新、断电恢复、死机重启、硬件换机都由我们在当地处理，机器 24 小时不休眠。" },
];

const STEPS = [
  { t: "选配置，在线付款", d: "在方案页选档位和付费周期。从下单开始，机器为你保留 30 分钟。" },
  { t: "等待配机", d: "付款后自动跳转订单页。我们准备机器、创建你的管理员账号，你不用再填任何资料。" },
  { t: "收到连接信息", d: "连接信息发到你验证过的邮箱，并写明机器所在城市。付款后 3 个工作日内完成。" },
];

const BOUNDARIES = [
  "不提供、不代开、不代管任何第三方账号，你用的服务由你自己注册和付费。",
  "不录屏、不记录按键，不为日常运营浏览你的文件。",
  "进入你的环境做维护之前，一定先取得你的同意，并留下操作记录。",
  "正常回收时整盘抹除、重装系统后才交给下一位。",
];

export default async function HomePage() {
  await releaseExpiredReservations();
  await trackView("/");
  const [plans, machines, faqs] = await Promise.all([
    db.plan.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    db.machine.findMany({ select: { name: true, status: true, chip: true } }),
    db.faq.findMany({ where: { published: true, category: "自营" }, orderBy: { sort: "asc" }, take: 4 }),
  ]);
  const byName = new Map(machines.map((m) => [m.name, m]));
  const available = machines.filter((m) => m.status === "AVAILABLE").length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-soft/60 to-bg">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <div className="eyebrow">远程 Mac · 中美跨境小团队</div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-navy md:text-5xl">
              你的远程 Mac，<br />有人照看。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft">
              一台真实的 Mac mini，只给你一个团队用。完整管理员权限，常用开发环境已装好。
              在国内连上它，就像在纽约多了一张永远开着的工位。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pricing#plans" className="btn-primary btn-lg">立即开通</Link>
              <Link href="/#delivery" className="btn-outline btn-lg">看看怎么交付</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {["月付 · 季付 · 年付", "不设押金", "到期不续即停"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-safe/20 bg-safe-soft px-3 py-1 text-safe">
                  <CheckIcon className="h-3.5 w-3.5" />{t}
                </span>
              ))}
            </div>
          </div>
          <ClockWidget />
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-20">
        <div className="eyebrow">一台机器，一个团队</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">不是虚拟机，也不是共用账号。</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          我们或签约运维为你准备一台实体机，接好电源和网络，交付时告诉你它在哪座城市。租期内由你的团队独享。
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.t} className="card p-6">
              <div className="font-mono text-xs text-safe">0{i + 1}</div>
              <div className="mt-2 font-semibold text-ink">{f.t}</div>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{f.d}</p>
            </div>
          ))}
          <div className="card bg-navy p-6 font-mono text-sm text-slate-300">
            {["git", "node", "python3", "tmux", "mosh", "brew"].map((c) => (
              <div key={c} className="flex justify-between py-0.5">
                <span><span className="text-slate-500">$</span> {c} --version</span>
                <span className="text-emerald-400">✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City picker */}
      <section className="border-y border-line bg-surface py-16">
        <div className="container-page">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">每台机器都有名字。</h2>
          <p className="mt-2 text-ink-soft">我们用美国城市给机器命名。挑一个你喜欢的，开通时就用它 · 当前现货 {available} 台。</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {CITY_NAMES.map((name) => {
              const m = byName.get(name);
              const free = m?.status === "AVAILABLE";
              return (
                <Link
                  key={name}
                  href={free ? `/pricing?name=${name}#plans` : "/pricing#plans"}
                  className={`group rounded-xl border p-4 transition ${free ? "border-line hover:border-brand hover:shadow-[var(--shadow-card)]" : "border-line bg-surface-2 opacity-70"}`}
                >
                  <div className="font-semibold text-ink">{name}</div>
                  <div className="mt-1 text-xs text-muted">{m?.chip ?? "—"}</div>
                  <div className={`mt-3 text-xs ${free ? "text-safe" : "text-muted"}`}>
                    {free ? "就叫这个名字 →" : "已有主人"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latency */}
      <section className="container-page py-20">
        <div className="eyebrow">隔着太平洋</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">延迟为什么不碍事。</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          现在写代码的节奏变了：你描述任务，AI 在机器上跑几分钟到几十分钟，你回来检查结果。延迟只落在你打字和点击的那几下，
          机器埋头干活的时候，和你的网络没有关系。
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { t: "你描述任务", d: "约 1–2 分钟", n: "每次按键多约 0.2 秒" },
            { t: "AI 在远程 Mac 上执行", d: "5–30 分钟", n: "读取项目 · 修改代码 · 跑测试 —— 和延迟无关" },
            { t: "你检查结果", d: "约 2–5 分钟", n: "看 diff、提交、布置下一个任务" },
          ].map((s, i) => (
            <div key={s.t} className={`card p-6 ${i === 1 ? "border-safe/40 bg-safe-soft/40" : ""}`}>
              <div className="text-xs text-muted">第 {i + 1} 步 · {s.d}</div>
              <div className="mt-2 font-semibold text-ink">{s.t}</div>
              <p className="mt-2 text-sm text-ink-soft">{s.n}</p>
            </div>
          ))}
        </div>
        <div className="mt-8"><LatencyDemo /></div>
        <p className="mt-4 text-sm text-muted">
          主要在终端里工作？用 SSH 配合 tmux 或 mosh，几乎感觉不到延迟。具体做法见<Link className="text-brand hover:underline" href="/guide">使用指南</Link>。
        </p>
      </section>

      {/* Delivery */}
      <section id="delivery" className="scroll-mt-20 border-y border-line bg-surface py-20">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight text-navy">付款之后，三步拿到机器。</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.t} className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white font-semibold">{i + 1}</div>
                <div className="mt-4 font-semibold text-ink">{s.t}</div>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-page py-20">
        <div className="grid gap-10 rounded-3xl bg-navy p-8 text-slate-200 md:grid-cols-[1fr_1.3fr] md:p-12">
          <div>
            <ShieldIcon className="h-10 w-10 text-emerald-400" />
            <h2 className="mt-4 text-2xl font-semibold text-white">机器交给你，<br />维护先征得同意。</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">把开发环境放在别人照看的机器上，信任是第一位的。所以我们先把边界写清楚。</p>
          </div>
          <ul className="space-y-4">
            {BOUNDARIES.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-6">
                <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />{b}
              </li>
            ))}
            <li className="pt-2 text-xs text-slate-500">详见 <Link className="underline" href="/privacy">隐私政策</Link> 与 <Link className="underline" href="/terms">服务条款</Link>。</li>
          </ul>
        </div>
      </section>

      {/* Plans */}
      <section className="container-page pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-navy">三种配置，付得越久越省。</h2>
            <p className="mt-2 text-sm text-muted">季付省 5%，年付省 12%。美元计价，人民币为约数。</p>
          </div>
          <Link href="/pricing" className="btn-outline">完整方案与计费说明</Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => <PlanCard key={p.id} plan={p} cycle="QUARTER" />)}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          家里有闲置的 Mac？<Link href="/market/become-host" className="text-brand hover:underline">成为房东，在租赁市场出租 →</Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-navy">开通之前，<br />你可能想知道。</h2>
            <Link href="/faq" className="btn-outline mt-6">查看全部问题</Link>
          </div>
          <div className="divide-y divide-line">
            {faqs.map((f) => (
              <details key={f.id} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink">
                  {f.question}<span className="text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-8">
            <h3 className="text-xl font-semibold text-navy">找设备，也来交流区聊聊。</h3>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              可租设备、求租需求、远程 Mac 使用经验，房东和租客都欢迎。也可以加微信 <span className="font-mono text-ink">{SITE.wechat}</span> 回复“进群”。
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/market/community" className="btn-outline">进入交流区</Link>
              <Link href="/market" className="btn-ghost">逛租赁市场</Link>
            </div>
            <p className="mt-4 text-xs text-muted">第三方设备的租金、交付与售后由双方自行约定。</p>
          </div>
          <div className="card flex flex-col justify-center bg-gradient-to-br from-brand to-navy p-8 text-white">
            <div className="text-xs tracking-widest text-emerald-300">现货有限 · 先付先得</div>
            <h3 className="mt-3 text-2xl font-semibold">想要一台自己的远程 Mac？</h3>
            <p className="mt-2 text-sm text-slate-300">选一档配置在线付款，我们把机器和账号配好，连接信息发到你的邮箱。</p>
            <div className="mt-6"><Link href="/pricing#plans" className="btn bg-white text-navy hover:bg-slate-100">立即开通</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
