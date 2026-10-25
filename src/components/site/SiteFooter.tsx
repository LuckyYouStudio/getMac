import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";

const COLS = [
  { title: "产品", links: [["/pricing", "方案与价格"], ["/#delivery", "交付流程"], ["/guide", "使用指南"], ["/faq", "常见问题"]] },
  { title: "租赁市场", links: [["/market", "找设备"], ["/market/wanted", "求租"], ["/market/become-host", "我要出租"], ["/market/community", "交流区"], ["/market/rules", "市场规则"]] },
  { title: "账户", links: [["/orders", "我的订单"], ["/messages", "站内消息"], ["/account", "账户设置"]] },
  { title: "关于", links: [["/about", "关于我们"], ["/terms", "服务条款"], ["/privacy", "隐私政策"]] },
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
          <p className="mt-3 text-sm text-slate-400">
            邮箱 <a className="text-slate-200 hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <br />微信 {SITE.wechat}
          </p>
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
        <div className="container-page flex flex-wrap justify-between gap-2 py-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} {SITE.name}. 第三方房东的方案由房东自行发布，平台不经手租金。</span>
          <span>美元计价，人民币为约数（1 USD ≈ ¥{SITE.usdToCny}）</span>
        </div>
      </div>
    </footer>
  );
}
