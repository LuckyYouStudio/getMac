import Link from "next/link";
import { MAX_SEATS_PER_MACHINE } from "@/lib/constants";
import { Code, DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "使用指南" };

const TOC = [
  { id: "receive", label: "交付时会收到什么" },
  { id: "uu", label: "用 UU 远程连接" },
  { id: "checklist", label: "首次登录清单" },
  { id: "ssh", label: "配置 SSH" },
  { id: "tmux", label: "tmux：断线不丢会话" },
  { id: "smooth", label: "mosh：打字不卡" },
  { id: "tailscale", label: "Tailscale 组网" },
  { id: "team", label: "给团队成员开账号" },
  { id: "trouble", label: "遇到问题" },
  { id: "tips", label: "安全与使用建议" },
];

export default function GuidePage() {
  return (
    <DocPage
      eyebrow="使用指南"
      title="连上你的远程 Mac"
      desc={<>从收到交付邮件，到在终端里流畅地工作。只想快速连上？先看 <Link className="text-brand hover:underline" href="/setup">设置手册</Link>。</>}
      toc={TOC}
    >
      <nav className="rounded-xl bg-surface-2 p-4 text-sm md:hidden">
        <div className="mb-2 font-medium text-ink">目录</div>
        <ol className="grid grid-cols-2 gap-1">
          {TOC.map((t) => <li key={t.id}><a className="text-brand" href={`#${t.id}`}>{t.label}</a></li>)}
        </ol>
      </nav>

      <h2 id="receive" className="scroll-mt-24">交付时会收到什么</h2>
      <p>付款后 3 个工作日内，交付邮件会发到你下单时填写的邮箱，同样的内容也会出现在订单页：</p>
      <ul>
        <li><b>UU 远程的设备码和临时连接密码</b>：用来第一次连上桌面。</li>
        <li><b>你的管理员账号和临时登录密码</b>：首次登录后请立即修改。</li>
        <li><b>机器名和所在城市</b>：比如 Chicago，位于温哥华基斯兰奴。</li>
        <li><b>到期日</b>：从交付当天起按自然月计算。</li>
      </ul>
      <p>这些是设备的连接信息，不是任何第三方账号。请不要把邮件转发到群聊或公开渠道。</p>

      <h2 id="uu" className="scroll-mt-24">用 UU 远程连接</h2>
      <ul>
        <li>在你的电脑上安装网易 UU 远程客户端并登录（UU 账号由你自己注册）。</li>
        <li>选择“连接其他设备”，输入设备码和临时密码，即可看到 Mac 桌面。</li>
        <li>远程桌面适合图形界面操作，比如 Xcode、模拟器、浏览器调试；终端工作推荐看下面的 SSH 和 mosh。</li>
      </ul>

      <h2 id="checklist" className="scroll-mt-24">首次登录清单</h2>
      <p>第一次进入桌面后，花五分钟做完这几件事：</p>
      <ul>
        <li>在“系统设置 → 用户与群组”里修改你的管理员密码，并更换 UU 的连接密码。</li>
        <li>确认“自动登录”保持开启，这样断电来电后机器能自己回到桌面，UU 也能重新上线。</li>
        <li><b>不要开启文件保险箱（FileVault）</b>：开启后机器重启会卡在解锁界面，远程无法连上，只能等我们到现场处理。</li>
        <li>确认 UU 远程设为开机自启，不要退出它。</li>
        <li>不要在这台机器上登录“查找”（Find My），否则回收时无法抹除。</li>
        <li>用你自己的账号登录 Git、编辑器和 AI 编程工具。</li>
      </ul>

      <h2 id="ssh" className="scroll-mt-24">配置 SSH</h2>
      <p>进入桌面后，打开“系统设置 → 通用 → 共享”，开启“远程登录”。之后在 Tailscale 网络里（见下文）即可 SSH：</p>
      <Code>{`# 本机生成密钥（已有可跳过）
ssh-keygen -t ed25519

# 把公钥放到远程 Mac 上
ssh-copy-id you@chicago

# 之后直接连接
ssh you@chicago`}</Code>
      <p>建议在远程 Mac 上关闭密码登录，只保留密钥登录。</p>

      <h2 id="tmux" className="scroll-mt-24">tmux：断线不丢会话</h2>
      <p>网络抖动时 SSH 可能会断，tmux 能让任务继续跑，重连后接着看。</p>
      <Code>{`tmux new -s work      # 新建会话
# 让 AI 编程工具或构建任务在里面跑……
# 按 Ctrl-b 再按 d 暂时离开

tmux attach -t work   # 回来继续`}</Code>

      <h2 id="smooth" className="scroll-mt-24">mosh：打字不卡</h2>
      <p>mosh 会在本地先显示你敲的字，再在后台和远程同步，跨太平洋也几乎感觉不到延迟。远程 Mac 已预装 mosh，本机安装后：</p>
      <Code>{`# macOS
brew install mosh
# Ubuntu / Debian
sudo apt install mosh

mosh you@chicago -- tmux attach -t work`}</Code>

      <h2 id="tailscale" className="scroll-mt-24">Tailscale 组网</h2>
      <p>Tailscale 能让你的电脑和远程 Mac 处在同一个私有网络里，不需要开放公网端口。</p>
      <ul>
        <li>在远程 Mac 和你的电脑上分别安装 Tailscale，并用同一个账号登录。</li>
        <li>在 Tailscale 后台给 Mac 起名（例如 chicago），之后用这个名字 SSH。</li>
        <li>Tailscale 账号由你自己注册和管理，我们不会代开。</li>
      </ul>

      <h2 id="team" className="scroll-mt-24">给团队成员开账号</h2>
      <p>一台机器最多可以建 {MAX_SEATS_PER_MACHINE} 个成员账号。在“系统设置 → 用户与群组”里添加用户，每人用自己的账号登录，互不干扰。不要多人共用同一个账号和密码。</p>

      <h2 id="trouble" className="scroll-mt-24">遇到问题</h2>
      <ul>
        <li><b>UU 显示设备离线</b>：可能是机器重启后卡在登录界面，或 UU 被退出了。发邮件告诉我们机器名，我们在本地处理，一般几小时内恢复。</li>
        <li><b>连上了但很卡</b>：先确认是不是你本地网络的问题（换个网络试试）；终端工作改用 mosh；远程桌面可以在 UU 里调低画质。</li>
        <li><b>机器没反应 / 死机</b>：告诉我们机器名和大概时间，我们会远程或现场重启，并告诉你原因。</li>
        <li><b>想重装系统或迁移到另一台</b>：联系我们安排，重装会清空所有数据，请先备份。</li>
      </ul>
      <p>按方案的回复时效处理：经济档 24 小时、标准档 12 小时、进阶档 8 小时内回复。</p>

      <h2 id="tips" className="scroll-mt-24">安全与使用建议</h2>
      <ul>
        <li>代码和重要文件用 Git 或你自己的云盘同步，我们默认不备份。</li>
        <li>需要我们帮忙维护时，我们会先在邮件里征得你的同意，并记录做了什么。</li>
        <li>不要在机器上运行挖矿、刷量或任何违法程序，否则会被停机。</li>
      </ul>
      <p>
        还有问题？看看 <Link className="text-brand hover:underline" href="/faq">常见问题</Link>，或 <Link className="text-brand hover:underline" href="/apply">联系我们</Link>。
      </p>
    </DocPage>
  );
}
