import Link from "next/link";
import type { ReactNode } from "react";
import { MARKET_LIMITS, REFUND_WINDOW_HOURS } from "@/lib/constants";

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  audience: "租客" | "房东" | "都适用";
  minutes: number;
  body: ReactNode;
};

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link className="text-brand hover:underline" href={href}>{children}</Link>
);

export const GUIDES: Guide[] = [
  {
    slug: "compare",
    title: "远程 Mac 怎么比较：一张表看清楚",
    summary: "芯片、内存、网络、权限、价格、谁来维护。比较远程 Mac 时，按这个顺序看。",
    audience: "租客",
    minutes: 5,
    body: (
      <>
        <p>同样写着“Mac mini M4 16G”，用起来可能差很多。比较时按下面的顺序看，越靠前越难事后补救。</p>
        <h2>1. 是不是实体机独享</h2>
        <p>实体机独享意味着 CPU、内存、硬盘只有你在用。虚拟机或多人共用一台机器，性能会被邻居拖慢，安全边界也更模糊。问清楚“这台机器同时还有谁在用”。</p>
        <h2>2. 网络：在哪、什么宽带</h2>
        <p>机器所在城市决定了延迟，宽带类型决定了稳定性。家庭宽带便宜但上行小、偶尔断线；机房网络稳定但价格高。看 <A href="/guides/network-test">家庭网络和机房网络的区别</A>。</p>
        <h2>3. 权限：能不能装软件</h2>
        <p>管理员权限、标准用户、仅 SSH 是三种完全不同的体验。需要装 Xcode、Docker 或改系统设置的话，必须有管理员权限。详见 <A href="/guides/access-types">权限的区别</A>。</p>
        <h2>4. 配置是否够用</h2>
        <ul>
          <li>只写代码、跑 AI 编程工具：M1/M2 + 16GB 足够。</li>
          <li>常开 Xcode 和模拟器：建议 M4 起步，16GB 以上。</li>
          <li>多人共用或多个模拟器：24GB 以上，或 Pro 芯片。</li>
        </ul>
        <h2>5. 价格要算总账</h2>
        <p>除了月租，还要看最短租期、首期、押金和额外费用。“月租便宜但要求先付半年”的方案，实际风险更高。</p>
        <h2>6. 出了问题谁来管</h2>
        <p>停电、死机、硬件坏了，多久能恢复？有没有人在机器旁边？到期后数据怎么处理？这些都要在付款前问清楚，参考 <A href="/guides/questions-before-renting">租之前要问的 10 个问题</A>。</p>
      </>
    ),
  },
  {
    slug: "questions-before-renting",
    title: "租之前要问房东的 10 个问题",
    summary: "在租赁市场找第三方设备时，把这 10 个问题问清楚再付款，能避开大部分坑。",
    audience: "租客",
    minutes: 4,
    body: (
      <>
        <p>租赁市场里的设备由第三方房东提供，平台不核验设备、不经手租金。所以付款前，请在站内对话里把下面这些问清楚，并保留聊天记录。</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li><b>机器在哪个城市、用什么网络？</b>家庭宽带还是办公网络，上行带宽多少。</li>
          <li><b>是整机独占吗？</b>有没有其他人同时使用这台机器。</li>
          <li><b>给不给管理员权限？</b>能不能自己装软件、改系统设置。</li>
          <li><b>用什么方式远程？</b>UU、向日葵、SSH、VNC 还是别的，能不能自己配 Tailscale。</li>
          <li><b>停电、死机怎么处理？</b>多久能恢复，房东是否在本地。</li>
          <li><b>具体配置是什么？</b>芯片、内存、硬盘、macOS 版本，可以请房东截“关于本机”。</li>
          <li><b>怎么付款、先付多少？</b>首期、押金、额外费用分别是多少，押金怎么退。</li>
          <li><b>连不上能退款吗？</b>交付后多久内可以退，怎么退。</li>
          <li><b>到期后数据怎么处理？</b>会不会整盘抹除。</li>
          <li><b>房东的回复时间？</b>出问题时一般多久能回复。</li>
        </ol>
        <h2>付款建议</h2>
        <ul>
          <li>第一次合作先按月付，不要大额预付。</li>
          <li>不要把联系方式发到公开区域，也不要被引导到站外私下交易后再“补押金”。</li>
          <li>对方要求先付半年、只收加密货币、或催你立即付款的，提高警惕，必要时 <A href="/market/rules#reports">举报</A>。</li>
        </ul>
        <p>不想自己核实？<A href="/pricing">自营方案</A> 由我们负责交付和售后，交付后 {REFUND_WINDOW_HOURS} 小时内因我们的原因无法使用可全额退款。</p>
      </>
    ),
  },
  {
    slug: "access-types",
    title: "管理员权限、SSH、远程桌面，有什么区别",
    summary: "同样是“远程 Mac”，你能做的事情取决于拿到的是哪一种访问方式。",
    audience: "都适用",
    minutes: 4,
    body: (
      <>
        <h2>远程桌面（UU、向日葵、ToDesk、VNC、Parsec）</h2>
        <p>你看到的是 Mac 的完整桌面，可以用鼠标操作 Xcode、模拟器、浏览器。缺点是每一下操作都要跨网络传画面，延迟明显时会有拖影。</p>
        <h2>SSH</h2>
        <p>只有终端，没有桌面。传的是文字，跨太平洋也很流畅，配合 tmux 或 mosh 几乎感觉不到延迟。适合写代码、跑构建和 AI 编程工具。</p>
        <h2>管理员权限 vs 标准用户</h2>
        <ul>
          <li><b>管理员</b>：可以安装软件、修改系统设置、开启远程登录、建其他用户。大多数开发都需要它。</li>
          <li><b>标准用户</b>：只能在自己的目录里工作，不能装需要授权的软件，也不能开 SSH。</li>
        </ul>
        <h2>怎么选</h2>
        <ul>
          <li>主要在终端里工作：确保能开 SSH，最好有管理员权限。</li>
          <li>要用 Xcode 图形界面、模拟器：需要远程桌面 + 管理员权限。</li>
          <li>只是临时打个包：标准用户 + 远程桌面也许够用，但先问清楚能不能装 Xcode。</li>
        </ul>
        <p>GetMac 的自营机器都提供完整管理员权限，用 UU 交付，SSH 和 Tailscale 可以自己配。见 <A href="/guide">使用指南</A>。</p>
      </>
    ),
  },
  {
    slug: "network-test",
    title: "家庭网络和机房网络的区别，以及怎么测",
    summary: "远程体验好不好，一半取决于机器那头的网络。教你在付款前后各测一次。",
    audience: "都适用",
    minutes: 5,
    body: (
      <>
        <h2>几种网络的特点</h2>
        <ul>
          <li><b>家庭宽带</b>：下行大、上行小（常见 20–50 Mbps），偶尔维护断线，价格最低。远程桌面主要吃上行。</li>
          <li><b>办公网络</b>：通常更稳定，但可能有防火墙限制，夜间和周末可能无人照看。</li>
          <li><b>机房</b>：对称带宽、双路供电，最稳定，价格也最高。</li>
        </ul>
        <h2>付款前怎么判断</h2>
        <ul>
          <li>请房东说明宽带运营商和上下行带宽，以及有没有 UPS。</li>
          <li>问机器所在城市，估算延迟：中国大陆到美西约 150 ms，到美东约 200–250 ms，到日本、新加坡约 50–90 ms。</li>
        </ul>
        <h2>拿到机器后怎么测</h2>
        <pre className="overflow-x-auto rounded-xl bg-navy p-4 font-mono text-sm leading-6 text-slate-200">{`# 在你的电脑上测往返延迟（换成机器的 Tailscale 名或 IP）
ping -c 20 chicago

# 在远程 Mac 上测带宽（macOS 自带）
networkQuality -v`}</pre>
        <p>延迟稳定比延迟低更重要。丢包或延迟忽高忽低时，远程桌面会明显卡顿，这时改用 SSH + mosh 能改善很多。</p>
        <p>还没有机器？<A href="/#plans">自营机器</A> 都在温哥华本地家用光纤上运行，接 UPS，有人照看。</p>
      </>
    ),
  },
  {
    slug: "self-vs-third-party",
    title: "自营和第三方：各自负责什么",
    summary: "GetMac 有自营机器，也有第三方房东的租赁市场。两者谁负责什么，一次讲清楚。",
    audience: "租客",
    minutes: 3,
    body: (
      <>
        <div className="overflow-x-auto">
          <table className="table min-w-[520px]">
            <thead><tr><th /><th>自营方案</th><th>租赁市场（第三方）</th></tr></thead>
            <tbody>
              <tr><td>设备提供方</td><td>GetMac 或签约的官方房东</td><td>第三方房东</td></tr>
              <tr><td>付款</td><td>站内付款，GetMac 收款</td><td>你和房东自行约定，平台不经手</td></tr>
              <tr><td>交付与售后</td><td>GetMac 负责</td><td>房东负责</td></tr>
              <tr><td>退款</td><td>按服务条款执行</td><td>按房东自己的规则</td></tr>
              <tr><td>设备核验</td><td>我们准备和检查每台机器</td><td>平台不核验，以房东自述为准</td></tr>
              <tr><td>平台的角色</td><td>服务提供方</td><td>信息展示、站内对话、处理举报</td></tr>
            </tbody>
          </table>
        </div>
        <h2>什么时候选哪个</h2>
        <ul>
          <li>想要省心、出问题有人兜底：选 <A href="/pricing">自营方案</A>。</li>
          <li>需要特定地区（日本、新加坡、欧洲）或特殊配置：去 <A href="/market">租赁市场</A> 找找，记得先读 <A href="/guides/questions-before-renting">租之前要问的问题</A>。</li>
        </ul>
        <p>平台在租赁市场里做的事：展示房东填写的方案、提供站内对话、处理举报和违规内容。平台不做的事：核验设备、担保交易、代收租金。详见 <A href="/market/rules">市场规则</A>。</p>
      </>
    ),
  },
  {
    slug: "hosting-checklist",
    title: "出租 Mac 之前要准备什么",
    summary: "想在租赁市场出租自己的 Mac？发布前对照这份清单，少踩坑，也让租客更放心。",
    audience: "房东",
    minutes: 5,
    body: (
      <>
        <h2>硬件和环境</h2>
        <ul>
          <li>整机独占出租：租期内这台机器只给一位租客用。</li>
          <li>接 UPS，避免短暂断电导致重启后连不上。</li>
          <li>稳定的宽带，最好有备用网络；了解自己的上行带宽。</li>
          <li>机器放在通风、不会被误关的地方。</li>
        </ul>
        <h2>系统和账号</h2>
        <ul>
          <li>出租前抹掉或迁走你自己的数据，至少用一个全新的系统账号给租客。</li>
          <li>退出你自己的 Apple ID 和“查找”。</li>
          <li>设置永不睡眠、断电后自动开机、自动登录。</li>
          <li>macOS 许可要求：出租的必须是你合法拥有的设备，并遵守 Apple 的软件许可条款。</li>
        </ul>
        <h2>规则</h2>
        <ul>
          <li>方案里不能留联系方式，联系一律走站内对话。</li>
          <li>每个账号最多同时有 {MARKET_LIMITS.maxActiveListings} 个有效方案。</li>
          <li>每 {MARKET_LIMITS.listingTtlDays} 天要确认一次“仍可租”，否则方案自动过期下线。</li>
          <li>不得转售第三方账号或网络服务，详见 <A href="/market/rules">市场规则</A>。</li>
        </ul>
        <p>准备好了？看 <A href="/guides/host-setup">出租设置步骤</A>，然后 <A href="/market/publish">发布方案</A>。不想自己找租客和售后，可以考虑 <A href="/join">成为官方房东</A>。</p>
      </>
    ),
  },
  {
    slug: "host-setup",
    title: "出租设置：一步步把机器准备好",
    summary: "从新建账号到测试远程连接，房东出租前的具体设置步骤。",
    audience: "房东",
    minutes: 6,
    body: (
      <>
        <h2>1. 给租客单独建账号</h2>
        <p>系统设置 → 用户与群组 → 添加用户。按你方案里写的权限，选择“管理员”或“标准”。不要让租客用你自己的账号。</p>
        <h2>2. 防睡眠、来电自动开机</h2>
        <pre className="overflow-x-auto rounded-xl bg-navy p-4 font-mono text-sm leading-6 text-slate-200">{`# 永不睡眠、断电恢复后自动开机
sudo pmset -a sleep 0 disksleep 0 displaysleep 0
sudo pmset -a autorestart 1

# 检查当前设置
pmset -g`}</pre>
        <p>同时在“用户与群组”里开启该账号的自动登录，并保持文件保险箱关闭，否则断电重启后会卡在解锁界面。</p>
        <h2>3. 装好远程工具</h2>
        <ul>
          <li>安装你在方案里写的远程方式（UU、向日葵、RustDesk 等），设为开机自启。</li>
          <li>需要 SSH 的话：系统设置 → 通用 → 共享 → 远程登录。</li>
        </ul>
        <h2>4. 自己先测一遍</h2>
        <ul>
          <li>从另一个网络远程连一次，确认能看到桌面、能打字。</li>
          <li>拔掉电源再插上，确认机器能自己回到可连接状态。</li>
          <li>记下“关于本机”的截图，租客问配置时可以直接发。</li>
        </ul>
        <h2>5. 到期后清理</h2>
        <p>租期结束后删除租客账号，或抹掉整盘重装，再交给下一位。在方案的“数据清理”一栏写清楚你的做法。</p>
        <p>都准备好了，就去 <A href="/market/publish">发布方案</A>。</p>
      </>
    ),
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
