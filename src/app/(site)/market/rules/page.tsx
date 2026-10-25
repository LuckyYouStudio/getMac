import Link from "next/link";
import { MARKET_LIMITS, REPORT_CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "市场规则" };

const L = MARKET_LIMITS;

const SECTIONS: { id: string; title: string; items: string[] }[] = [
  {
    id: "role",
    title: "平台的角色",
    items: [
      "租赁市场是信息展示和站内对话的地方。方案由房东自行发布，内容由房东负责。",
      "GetMac 不核验房东身份和设备，不经手租金，不担保交付和售后，也不是任何一笔租赁的当事方。",
      "GetMac 自营方案与本站存在商业关系，单独展示并明确标注，不混在第三方结果里。",
    ],
  },
  {
    id: "exclusive",
    title: "整机独占与许可",
    items: [
      "只允许整台机器出租给一位租客独占使用，按月起租；不接受共享账号、按小时出租或虚拟机分租。",
      "出租须符合 macOS 软件许可，房东应有权出租该设备。",
    ],
  },
  {
    id: "contact",
    title: "不在公开内容里留联系方式",
    items: [
      "方案标题、描述、求租、帖子、昵称和简介里不能出现电话、微信、QQ、邮箱、Telegram、IP 地址或详细地址。",
      "联系一律走站内对话。系统会自动拦截包含联系方式的内容。",
    ],
  },
  {
    id: "listings",
    title: "发布方案",
    items: [
      "登录即可免费发布，发布后立即公开，平台事后复查。需要修改时会说明原因，修改后自动恢复展示。",
      `每个账号最多同时 ${L.maxActiveListings} 个有效方案，不得重复发布同一台机器。`,
      `方案每 ${L.listingTtlDays} 天需确认一次仍可租，到期前 ${L.listingConfirmWindowDays} 天内可确认；回复租客、修改方案或更新档期也会续期。未确认的方案自动过期，不再展示。`,
      `关闭的方案 ${L.listingReopenDays} 天内可以重新开放。最短租期只能是 1、3、6 或 12 个月。`,
    ],
  },
  {
    id: "wanted",
    title: "求租",
    items: [
      `每人最多同时 ${L.maxActiveWanted} 条征集中的求租，开始日期须在 180 天之内，每 ${L.wantedTtlDays} 天确认一次。`,
      `有发布中方案的房东可以回应求租。每条求租最多 ${L.wantedMaxResponses} 个回应，每位房东每天最多回应 ${L.wantedHostDailyResponses} 条。`,
      `关闭或已租到的求租 ${L.wantedReopenDays} 天内可以重新开放。`,
    ],
  },
  {
    id: "inquiries",
    title: "咨询与对话",
    items: [
      `注册未满 ${L.newAccountDays} 天的账号每天最多发起 ${L.newAccountDailyInquiries} 个新对话，之后每天最多 ${L.dailyInquiries} 个。`,
      "咨询不是订单，不产生任何费用。发起咨询时会记录当时的报价，方便之后对照。",
      "任何一方都可以屏蔽对方，屏蔽后双方都不能再发消息或发起咨询。",
    ],
  },
  {
    id: "deals",
    title: "交易与付款",
    items: [
      "付款方式、交付方式和退款由双方自行约定，平台不经手。",
      "第一次合作请按月付，不要大额预付。要求站外私下联系或先付大额款项的，多半有问题，请举报。",
      `谈妥后可以在对话里“确认成交”，一方发起、另一方确认。确认后双方可在 ${L.reviewWindowDays} 天内互评，双方都提交或期限到后同时公开。`,
    ],
  },
  {
    id: "prohibited",
    title: "禁止的内容和行为",
    items: [
      "转售、代开、出借任何第三方账号或订阅；提供代理、VPN、翻墙或规避地区限制与制裁的服务。",
      "冒充他人、冒充 GetMac 官方；昵称里使用“官方”“客服”“管理员”等字样。",
      "虚假配置、过期信息、诱导站外交易、骚扰、刷屏、诈骗、泄露他人隐私。",
      "用于挖矿、刷量、攻击他人或任何违法用途。",
    ],
  },
  {
    id: "community",
    title: "交流区",
    items: [
      "注册未满 7 天的账号和含链接的帖子需要先审核再公开。",
      `每天最多发 ${L.dailyTopics} 个话题，间隔至少 ${L.topicIntervalMinutes} 分钟；回复间隔至少 ${L.replyIntervalSeconds} 秒，每天最多 ${L.dailyReplies} 条（新账号 ${L.newAccountDailyReplies} 条）。`,
      `发帖后 ${L.postEditMinutes} 分钟内可以编辑，自己的帖子可以随时删除。`,
    ],
  },
  {
    id: "reports",
    title: "举报",
    items: [
      `登录后可以举报方案、求租、帖子、回复、私信和用户。举报类型：${Object.values(REPORT_CATEGORIES).join("、")}。`,
      "平台会核实举报，必要时查看被举报私信的前后几条消息，仅用于处理这次举报。",
    ],
  },
  {
    id: "enforcement",
    title: "处理措施",
    items: [
      "视情节要求修改、下架内容、隐藏帖子，或将账号设为受限（只能回复已有对话）、暂停（不能登录）。",
      "对处理结果有异议，可以发邮件申诉，我们会在 3 个工作日内回复。",
    ],
  },
  {
    id: "changes",
    title: "规则变更",
    items: ["规则可能根据运营情况调整，重大变更会在站内公告。继续使用市场即表示接受最新规则。"],
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="市场规则" desc="适用于租赁市场里的方案、求租、对话和交流区。" />
      <nav className="card mb-8 grid gap-1 p-4 text-sm sm:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="text-brand hover:underline">{i + 1}. {s.title}</a>
        ))}
      </nav>
      <div className="space-y-8">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-lg font-semibold">{i + 1}. {s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-ink-soft">
              {s.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted">
        相关：<Link href="/guides/questions-before-renting" className="text-brand hover:underline">租之前要问的问题</Link> ·{" "}
        <Link href="/terms" className="text-brand hover:underline">服务条款</Link>
      </p>
    </div>
  );
}
