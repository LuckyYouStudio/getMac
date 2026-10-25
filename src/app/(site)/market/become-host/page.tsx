import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { HOST_STATUS } from "@/lib/constants";
import { CheckIcon, Notice, ShieldIcon, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { applyHostAction } from "../actions";

export const metadata = { title: "我要出租 · 成为房东" };

const STEPS = [
  ["提交认证", "简单介绍你的设备和网络环境，留一个方便平台联系的微信。"],
  ["平台审核", "我们会核对你填写的信息，一般 1–2 个工作日内给结果。"],
  ["发布方案", "填写配置、价格和交付方式。每个方案都要审核后才公开。"],
  ["站内沟通", "租客在站内咨询你，租金和交付由你们双方约定。"],
];

const REQUIREMENTS = [
  "设备 24 小时开机，接入稳定的电源和网络（最好有 UPS）",
  "能给租客独立账号，并在交付前清除你的个人数据",
  "出现停电、死机等问题时，能在约定时间内处理",
  "如实描述配置、地区、网络类型和账号权限",
  "到期后整盘抹除租客数据，不留存、不查看",
];

export default async function BecomeHostPage({ searchParams }: { searchParams: Promise<{ applied?: string; err?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">成为 GetMac 房东</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">家里的闲置 Mac，<br />租给需要的人。</h1>
          <p className="mt-4 max-w-xl leading-7 text-ink-soft">
            很多国内开发者需要一台海外的 Mac 跑构建、跑 AI 编程任务。你提供机器和网络，我们提供展示和站内沟通的地方。
            发布免费，平台不抽成，也不经手租金。
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#apply" className="btn-primary btn-lg">申请认证</a>
            <Link href="/market/rules" className="btn-outline btn-lg">先看市场规则</Link>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldIcon className="h-5 w-5 text-safe" />对房东的要求</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex gap-2"><CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-safe" />{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">四步开始出租</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{i + 1}</span>
              <h3 className="mt-3 font-medium">{t}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="apply" className="card mx-auto max-w-2xl scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold">房东认证申请</h2>
        {!user ? (
          <div className="mt-4">
            <p className="text-sm text-muted">登录后即可提交申请。</p>
            <Link href="/login?next=/market/become-host" className="btn-primary mt-4">登录 / 注册</Link>
          </div>
        ) : user.hostStatus === "VERIFIED" ? (
          <div className="mt-4 space-y-4">
            <Notice tone="ok">你已经是认证房东，可以直接发布方案。</Notice>
            <div className="flex gap-2">
              <Link href="/market/publish" className="btn-primary">发布方案</Link>
              <Link href="/market/mine" className="btn-outline">管理我的方案</Link>
            </div>
          </div>
        ) : user.hostStatus === "PENDING" ? (
          <div className="mt-4">
            <Notice tone="info">
              {sp.applied ? "申请已提交！" : ""}你的认证正在审核中，一般 1–2 个工作日内完成。结果会显示在这里。
            </Notice>
          </div>
        ) : (
          <form action={applyHostAction} className="mt-4 space-y-4">
            <p className="text-sm text-muted">当前状态：<StatusBadge map={HOST_STATUS} value={user.hostStatus} /></p>
            {user.hostStatus === "REJECTED" && (
              <Notice tone="warn">上次申请未通过，可以补充信息后重新提交。</Notice>
            )}
            <label className="block">
              <span className="label">介绍一下你的设备和环境</span>
              <textarea
                name="hostIntro"
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                defaultValue={user.hostIntro ?? ""}
                className="input"
                placeholder="例如：西雅图家中一台 Mac mini M4 16G，千兆家庭宽带，接 UPS，可提供管理员账号，平时由我本人维护。"
              />
            </label>
            {sp.err === "intro" && <p className="text-sm text-danger">介绍至少 10 个字。</p>}
            <label className="block">
              <span className="label">微信（仅平台审核联系用，不公开）</span>
              <input name="wechat" maxLength={50} defaultValue={user.wechat ?? ""} className="input" />
            </label>
            <SubmitButton pendingText="提交中…">提交认证申请</SubmitButton>
          </form>
        )}
      </section>
    </div>
  );
}
