import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ApplyForm } from "@/components/selfserve/ApplyForm";
import { WechatGroup } from "@/components/site/WechatGroup";
import { CopyButton } from "@/components/site/CopyButton";

export const metadata = { title: "联系我们" };

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ plan?: string; order?: string }> }) {
  const sp = await searchParams;
  const plan = ["economy", "standard", "pro", "custom", "unsure", "upgrade"].includes(sp.plan ?? "") ? sp.plan! : "unsure";
  return (
    <div className="container-page py-14">
      <div className="eyebrow">联系我们</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy">
        {plan === "custom" ? "说说你要的配置。" : plan === "upgrade" ? "升级到更高一档。" : "拿不准？先聊聊。"}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {plan === "custom"
          ? "芯片、内存、存储和台数都可以定，半年起租。留下需求，我们核对到货情况后单独报价。"
          : plan === "upgrade"
            ? `升级差价按当期剩余天数折算，机器会换成新档位的一台，数据迁移我们协助完成。${sp.order ? `关联订单 ${sp.order}。` : ""}`
            : "不知道选哪档、想多台一起开、或有别的问题，都可以在这里留言。工作日 1 天内回复。"}
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-6 md:p-8">
          <ApplyForm defaultPlan={plan} orderNo={sp.order} />
        </div>
        <aside className="space-y-4">
          <div className="card space-y-3 p-6 text-sm">
            <div className="font-medium text-ink">也可以直接找我们</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">邮箱</span>
              <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">微信</span>
              <span className="flex items-center gap-2"><span className="font-mono">{SITE.wechat}</span><CopyButton text={SITE.wechat} /></span>
            </div>
            <p className="text-xs text-muted">已下单的问题，请附上订单号。</p>
          </div>
          <div className="card p-6 text-sm leading-6 text-ink-soft">
            <div className="font-medium text-ink">常见问法</div>
            <ul className="mt-2 space-y-1">
              <li>· <Link className="text-brand hover:underline" href="/faq#usage">几个人能一起用？</Link></li>
              <li>· <Link className="text-brand hover:underline" href="/faq#billing">能开发票吗？</Link></li>
              <li>· <Link className="text-brand hover:underline" href="/pricing#billing">怎么计费、怎么续费？</Link></li>
              <li>· <Link className="text-brand hover:underline" href="/join">我有机器，想当房东</Link></li>
            </ul>
          </div>
        </aside>
      </div>

      <section id="wechat-group" className="mt-14 scroll-mt-24">
        <h2 className="mb-4 text-xl font-semibold text-navy">加入微信交流群</h2>
        <WechatGroup />
      </section>
    </div>
  );
}
