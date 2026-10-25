import Link from "next/link";
import { Code, DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "使用指南" };

const TOC = [
  { id: "uu", label: "1. 用 UU 远程连接" },
  { id: "ssh", label: "2. 配置 SSH" },
  { id: "tmux", label: "3. tmux：断线不丢会话" },
  { id: "smooth", label: "4. mosh：打字不卡" },
  { id: "tailscale", label: "5. Tailscale 组网" },
  { id: "tips", label: "6. 安全与使用建议" },
];

export default function GuidePage() {
  return (
    <DocPage eyebrow="使用指南" title="连上你的远程 Mac" desc="从第一次登录桌面，到在终端里流畅地工作。按需挑着看即可。" toc={TOC}>
      <h2 id="uu" className="scroll-mt-24">1. 用 UU 远程连接</h2>
      <p>交付邮件里会有 UU 远程的设备码和临时密码。</p>
      <ul>
        <li>在你的电脑上安装网易 UU 远程客户端并登录。</li>
        <li>输入设备码和临时密码，即可看到 Mac 桌面。</li>
        <li>第一次登录后，请在“系统设置 → 用户与群组”里修改管理员密码。</li>
      </ul>
      <p>远程桌面适合图形界面操作，比如 Xcode、模拟器、浏览器调试。</p>

      <h2 id="ssh" className="scroll-mt-24">2. 配置 SSH</h2>
      <p>进入桌面后，打开“系统设置 → 通用 → 共享”，开启“远程登录”。之后在 Tailscale 网络里（见第 5 步）即可 SSH：</p>
      <Code>{`# 本机生成密钥（已有可跳过）
ssh-keygen -t ed25519

# 把公钥放到远程 Mac 上
ssh-copy-id you@chicago

# 之后直接连接
ssh you@chicago`}</Code>
      <p>建议在远程 Mac 上关闭密码登录，只保留密钥登录。</p>

      <h2 id="tmux" className="scroll-mt-24">3. tmux：断线不丢会话</h2>
      <p>网络抖动时 SSH 可能会断，tmux 能让任务继续跑，重连后接着看。</p>
      <Code>{`tmux new -s work      # 新建会话
# 让 AI 编程工具或构建任务在里面跑……
# 按 Ctrl-b 再按 d 暂时离开

tmux attach -t work   # 回来继续`}</Code>

      <h2 id="smooth" className="scroll-mt-24">4. mosh：打字不卡</h2>
      <p>mosh 会在本地先显示你敲的字，再在后台和远程同步，跨太平洋也几乎感觉不到延迟。远程 Mac 已预装 mosh，本机安装后：</p>
      <Code>{`# macOS
brew install mosh
# Ubuntu / Debian
sudo apt install mosh

mosh you@chicago -- tmux attach -t work`}</Code>

      <h2 id="tailscale" className="scroll-mt-24">5. Tailscale 组网</h2>
      <p>Tailscale 能让你的电脑和远程 Mac 处在同一个私有网络里，不需要开放公网端口。</p>
      <ul>
        <li>在远程 Mac 和你的电脑上分别安装 Tailscale，并用同一个账号登录。</li>
        <li>在 Tailscale 后台给 Mac 起名（例如 chicago），之后用这个名字 SSH。</li>
        <li>Tailscale 账号由你自己注册和管理，我们不会代开。</li>
      </ul>

      <h2 id="tips" className="scroll-mt-24">6. 安全与使用建议</h2>
      <ul>
        <li>收到机器后第一件事：修改管理员密码，开启文件保险箱（FileVault）。</li>
        <li>代码仓库、云服务用你自己的账号登录，离开时不必退出——机器只有你在用。</li>
        <li>需要我们帮忙维护时，我们会先在邮件里征得你的同意。</li>
        <li>不要在机器上运行挖矿、刷量或任何违法程序，否则会被停机。</li>
      </ul>
      <p>还有问题？看看 <Link className="text-brand hover:underline" href="/faq">常见问题</Link>，或到 <Link className="text-brand hover:underline" href="/market/community">交流区</Link> 问问其他用户。</p>
    </DocPage>
  );
}
