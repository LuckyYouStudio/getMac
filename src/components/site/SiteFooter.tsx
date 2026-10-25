import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";
import { NyClock } from "./NyClock";
import { CopyButton } from "./CopyButton";

const COLS = [
  {
    title: "自营远程 Mac",
    links: [["/pricing", "方案与价格"], ["/#delivery", "交付流程"], ["/guide", "使用指南"], ["/setup", "设置手册"], ["/faq", "常见问题"], ["/orders", "我的订单"]],
  },
  {
    title: "租赁市场",
    links: [["/market", "找设备"], ["/market/wanted", "求租"], ["/market/become-host", "在市场出租"], ["/market/community", "交流区"], ["/market/rules", "市场规则"], ["/guides", "选购指南"]],
  },
  {
    title: "房东",
    links: [["/join", "成为官方房东"], ["/host-agreement", "官方房东协议"], ["/ops", "房东后台"], ["/guides/hosting-checklist", "出租前准备"]],
  },
  {
    title: "关于",
    links: [["/about", "关于我们"], ["/apply", "联系我们"], ["/apply#wechat-group", "加入微信群"], ["/terms", "服务条款"], ["/privacy", "隐私政策"]],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-slate-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
            实体机独享的远程 Mac。机器交给你，维护先征得同意。
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <div>
              邮箱 <a className="text-slate-200 hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              微信 <span className="font-mono text-slate-200">{SITE.wechat}</span>
              <CopyButton text={SITE.wechat} label="复制" className="rounded-md border border-white/15 px-2 py-0.5 text-xs text-slate-200 hover:bg-white/10" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400"><NyClock /></p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="text-sm font-semibold text-white">{c.title}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}><Link className="hover:text-white" href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page space-y-1.5 py-4 text-xs leading-5 text-slate-500">
          <div className="flex flex-wrap justify-between gap-2">
            <span>© {new Date().getFullYear()} {SITE.name}. 租赁市场的方案由第三方房东发布，平台不经手租金。</span>
            <span>美元计价，人民币为约数（1 USD ≈ ¥{SITE.usdToCny}）</span>
          </div>
          <p>Apple、Mac、Mac mini、macOS 与 Xcode 是 Apple Inc. 在美国及其他国家和地区注册的商标。{SITE.name} 独立运营，与 Apple Inc. 没有任何关联，也未获其认可或赞助。</p>
        </div>
      </div>
    </footer>
  );
}
