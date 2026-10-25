import Link from "next/link";
import { DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "设置手册" };

const TOC = [
  { id: "before", label: "开始之前" },
  { id: "connect", label: "第一次连接" },
  { id: "after", label: "连上之后" },
  { id: "issues", label: "两种常见故障" },
];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{n}</div>
      <div className="min-w-0">
        <div className="font-medium text-ink">{title}</div>
        <div className="mt-1 text-sm leading-6 text-ink-soft">{children}</div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <DocPage
      eyebrow="设置手册"
      title="十分钟连上你的机器"
      desc={<>收到交付邮件后照着做就行。想了解 SSH、tmux、mosh 等进阶用法，看 <Link className="text-brand hover:underline" href="/guide">使用指南</Link>。</>}
      toc={TOC}
    >
      <h2 id="before" className="scroll-mt-24">开始之前</h2>
      <p>你需要准备：</p>
      <ul>
        <li>交付邮件（或订单页）里的 <b>UU 设备码</b>、<b>UU 连接密码</b>、<b>Mac 管理员账号和临时密码</b>。</li>
        <li>一台能上网的电脑，Windows、macOS 都可以。</li>
        <li>一个你自己的网易 UU 远程账号。</li>
      </ul>

      <h2 id="connect" className="scroll-mt-24">第一次连接</h2>
      <div className="not-prose space-y-5">
        <Step n={1} title="安装 UU 远程">在 UU 远程官网下载对应系统的客户端，安装后用你自己的账号登录。</Step>
        <Step n={2} title="连接设备">点“连接其他设备”，输入设备码，再输入连接密码。几秒后能看到 Mac 的桌面。</Step>
        <Step n={3} title="登录 macOS">如果停在登录界面，用交付的管理员账号和临时密码登录。</Step>
        <Step n={4} title="调一下画质">网络一般时，在 UU 的设置里把画质调到“流畅”，操作会顺很多。</Step>
      </div>

      <h2 id="after" className="scroll-mt-24">连上之后</h2>
      <p>按顺序做完这几件事，之后就可以放心用了：</p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>修改 macOS 管理员密码（系统设置 → 用户与群组）。</li>
        <li>修改 UU 的连接密码，并确认 UU 设为开机自启。</li>
        <li>确认“自动登录”是开启的：断电来电后机器能自己回到桌面，UU 才会重新上线。</li>
        <li>保持文件保险箱（FileVault）关闭：开启后重启会卡在解锁界面，远程无法连接。</li>
        <li>不要在这台机器上登录“查找”（Find My）。</li>
        <li>用你自己的账号登录 Git、编辑器、AI 编程工具。需要给同事用，就在“用户与群组”里为他单独建账号。</li>
      </ol>

      <h2 id="issues" className="scroll-mt-24">两种常见故障</h2>
      <p><b>UU 一直显示离线。</b>通常是机器重启后停在登录界面，或 UU 被关掉了。把机器名发给我们，我们在本地处理。</p>
      <p><b>能连上，但操作很卡。</b>先换个网络排除本地问题，再把 UU 画质调低。主要写代码的话，按 <Link className="text-brand hover:underline" href="/guide#smooth">使用指南</Link> 配好 SSH 和 mosh，会比远程桌面顺得多。</p>
      <p>其他问题请 <Link className="text-brand hover:underline" href="/apply">联系我们</Link>，附上订单号和机器名。</p>
    </DocPage>
  );
}
