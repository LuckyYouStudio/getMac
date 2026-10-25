import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ShieldIcon } from "@/components/ui";

export const metadata = { title: "关于我们" };

export default function AboutPage() {
  return (
    <div className="container-page py-14">
      <div className="eyebrow">关于 {SITE.name}</div>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-navy">把远程开发机的琐事，替你一件件弄好。</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="card prose-gm p-8">
          <p>
            我们自己就是一支跨时区协作的小团队。为了让国内的同事用上和美国一样的开发环境，最早只是在办公室角落放了一台 Mac mini，让大家远程连过来。
          </p>
          <p>
            远程连接本身不难，难的是网络、远程工具、系统更新、断电恢复这些没完没了的琐事。{SITE.name} 做的，就是把这些事情接过来，让你只管写代码。
          </p>
          <p>
            后来越来越多朋友手里也有闲置的 Mac，于是我们又做了租赁市场：房东发布方案，租客在站内咨询，平台审核信息、处理举报，但不经手租金。
          </p>
          <h2>我们坚持的几件事</h2>
          <ul>
            <li>实体机独享，不超售、不共用账号。</li>
            <li>不看你的文件，维护前先征得同意。</li>
            <li>价格写清楚：没有押金、没有隐藏费用、到期即停。</li>
          </ul>
        </div>
        <aside className="space-y-4">
          <div className="card p-6">
            <ShieldIcon className="h-8 w-8 text-safe" />
            <div className="mt-3 font-semibold">联系我们</div>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              邮箱：<a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a><br />
              微信：{SITE.wechat}<br />
              工作时间：北京时间 9:00–23:00
            </p>
          </div>
          <Link href="/pricing" className="btn-primary w-full">查看方案</Link>
          <Link href="/market" className="btn-outline w-full">逛租赁市场</Link>
        </aside>
      </div>
    </div>
  );
}
