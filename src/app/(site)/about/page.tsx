import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ShieldIcon } from "@/components/ui";
import { CopyButton } from "@/components/site/CopyButton";

export const metadata = { title: "关于我们" };

const VALUES = [
  { k: "独", t: "一台机器，一个团队", d: "实体机独享，不超售、不共用账号。你的构建不会因为邻居跑任务而变慢。" },
  { k: "守", t: "有人在旁边", d: "机器放在大温哥华地区的家里或办公室，断电、死机、硬件故障都有人在本地处理。" },
  { k: "界", t: "边界写在前面", d: "不看你的文件、不录屏、不记按键。需要进你的环境维护，先问你，再动手，留记录。" },
  { k: "明", t: "价格写清楚", d: "没有押金、没有开通费和流量费。自动续费可以随时关，关了就到期停。" },
];

export default function AboutPage() {
  return (
    <div className="container-page py-14">
      <div className="eyebrow">关于 {SITE.name}</div>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-navy">把远程开发机的琐事，替你一件件弄好。</h1>

      <div className="mt-10 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="card prose-gm p-8">
          <h2 className="!mt-0">从办公室角落的一台 Mac mini 开始</h2>
          <p>
            我们是一支跨中加两地协作的小团队。为了让国内的同事用上和北美一样的开发环境，最早只是在温哥华办公室的角落放了一台 Mac mini，让大家远程连过来。
          </p>
          <p>
            远程连接本身不难，难的是没完没了的琐事：宽带断了谁去重启路由器，系统更新后远程工具没起来，停电之后机器卡在登录界面，硬盘快满了没人发现。{SITE.name} 做的，就是把这些事接过来，让你只管写代码。
          </p>
          <p>
            后来，身边越来越多朋友手里也有闲置的 Mac，于是我们做了两件事：一是 <Link href="/join" className="text-brand hover:underline">官方房东计划</Link>，房东提供机器，我们负责找租客、交付和售后；二是 <Link href="/market" className="text-brand hover:underline">租赁市场</Link>，房东自己发布方案、和租客直接沟通，平台提供站内对话和举报处理，不经手租金。
          </p>
          <h2>你的深夜，是我们的白天</h2>
          <p>
            温哥华和北京差 15 到 16 个小时。你下班前布置的长任务，正好在温哥华的白天跑，旁边有人看着；你早上醒来，结果已经在那里了。出了问题，我们在温哥华的工作时间，往往也是你在国内睡觉的时候，等你醒来，机器多半已经恢复。
          </p>
        </div>
        <aside className="space-y-4">
          <div className="card p-6">
            <ShieldIcon className="h-8 w-8 text-safe" />
            <div className="mt-3 font-semibold">联系我们</div>
            <div className="mt-3 space-y-2 text-sm text-ink-soft">
              <div>邮箱 <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></div>
              <div className="flex flex-wrap items-center gap-2">微信 <span className="font-mono">{SITE.wechat}</span><CopyButton text={SITE.wechat} /></div>
              <div>回复时间：工作日 1 天内；已开通的机器按档位时效处理</div>
            </div>
          </div>
          <Link href="/pricing" className="btn-primary w-full">查看自营方案</Link>
          <Link href="/apply" className="btn-outline w-full">给我们留言</Link>
        </aside>
      </div>

      <h2 className="mt-16 text-xl font-semibold text-navy">我们坚持的四件事</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((v) => (
          <div key={v.k} className="card p-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-xl font-semibold text-white">{v.k}</div>
            <div className="mt-4 font-semibold text-ink">{v.t}</div>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{v.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
