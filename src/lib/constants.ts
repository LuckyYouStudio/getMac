// 各状态字段的取值与中文标签。前后台共用。

export const SITE = {
  name: "GetMac",
  slogan: "你的远程 Mac，有人照看",
  email: "shuangliu.cad@gmail.com",
  wechat: "leahfather",
  usdToCny: 7.0,
  // 微信群二维码有效期（过期后提示加微信进群）
  wechatGroupExpires: "2026-11-30",
  // 刷卡账单上显示的商家名
  billingDescriptor: "GETMAC REMOTE",
};

/** 自营机器的城市名，用于“给机器起名”的建议（实际列表以 Machine 表为准） */
export const CITY_NAMES = [
  "Austin", "Boston", "Chicago", "Denver", "Miami",
  "Nashville", "Phoenix", "Portland", "Seattle",
] as const;

// ───────────────────────── 自营计费 ─────────────────────────

export const CYCLES = {
  MONTH: { label: "月付", months: 1 },
  QUARTER: { label: "季付", months: 3 },
  YEAR: { label: "年付", months: 12 },
} as const;
export type Cycle = keyof typeof CYCLES;

export function isCycle(v: unknown): v is Cycle {
  return v === "MONTH" || v === "QUARTER" || v === "YEAR";
}

type PlanPrices = { priceMonth: number; priceQuarter: number; priceYear: number };

/** 某周期的月均价（美元） */
export function planMonthly(plan: PlanPrices, cycle: Cycle) {
  return cycle === "YEAR" ? plan.priceYear : cycle === "QUARTER" ? plan.priceQuarter : plan.priceMonth;
}

/** 某周期一次预付的总价（美元） */
export function cycleTotal(plan: PlanPrices, cycle: Cycle) {
  return planMonthly(plan, cycle) * CYCLES[cycle].months;
}

/** 相对月付节省的百分比（取整） */
export function savingPct(plan: PlanPrices, cycle: Cycle) {
  return Math.round((1 - planMonthly(plan, cycle) / plan.priceMonth) * 100);
}

/** 所有方案中某周期的最小节省比例，用于“省 x% 起” */
export function minSaving(plans: PlanPrices[], cycle: Cycle) {
  if (plans.length === 0) return 0;
  return Math.min(...plans.map((p) => savingPct(p, cycle)));
}

/** 下单后机器保留时长（分钟） */
export const RESERVE_MINUTES = 30;
/** 交付后多少小时内因我方原因无法使用可全额退款 */
export const REFUND_WINDOW_HOURS = 72;
/** 每台机器最多的团队成员账号数 */
export const MAX_SEATS_PER_MACHINE = 6;

/** 官方房东：平台按每台每月固定收取的服务费（美元），其余归房东 */
export const OFFICIAL_HOST_FEE = 30;

// ───────────────────────── 状态 ─────────────────────────

export type Tone = "ok" | "warn" | "info" | "danger" | "muted";
type StatusMap = Record<string, { label: string; tone: Tone }>;

export const ORDER_STATUS: StatusMap = {
  PENDING: { label: "待付款", tone: "warn" },
  PAID: { label: "已付款", tone: "info" },
  PROVISIONING: { label: "配机中", tone: "info" },
  DELIVERED: { label: "使用中", tone: "ok" },
  EXPIRED: { label: "已到期", tone: "muted" },
  CANCELLED: { label: "已取消", tone: "muted" },
  REFUNDED: { label: "已退款", tone: "muted" },
};

export const MACHINE_STATUS: StatusMap = {
  ONBOARDING: { label: "待上架", tone: "warn" },
  AVAILABLE: { label: "空闲", tone: "ok" },
  RESERVED: { label: "已保留", tone: "warn" },
  RENTED: { label: "出租中", tone: "info" },
  MAINTENANCE: { label: "维护中", tone: "danger" },
  RETIRED: { label: "已退役", tone: "muted" },
};

export const LISTING_STATUS: StatusMap = {
  DRAFT: { label: "草稿", tone: "muted" },
  PUBLISHED: { label: "发布中", tone: "ok" },
  NEEDS_CHANGES: { label: "需修改", tone: "warn" },
  PAUSED: { label: "暂停咨询", tone: "info" },
  EXPIRED: { label: "已过期", tone: "muted" },
  CLOSED: { label: "已关闭", tone: "muted" },
  REMOVED: { label: "已被下架", tone: "danger" },
};

export const WANTED_STATUS: StatusMap = {
  OPEN: { label: "征集中", tone: "ok" },
  FILLED: { label: "已租到", tone: "info" },
  CLOSED: { label: "已关闭", tone: "muted" },
  EXPIRED: { label: "已过期", tone: "muted" },
  HIDDEN: { label: "已隐藏", tone: "danger" },
};

export const POST_STATUS: StatusMap = {
  PENDING: { label: "待审核", tone: "warn" },
  PUBLISHED: { label: "已发布", tone: "ok" },
  HIDDEN: { label: "已隐藏", tone: "danger" },
};

export const DEAL_STATUS: StatusMap = {
  PROPOSED: { label: "待对方确认", tone: "warn" },
  CONFIRMED: { label: "双方已确认", tone: "ok" },
  DECLINED: { label: "对方未确认", tone: "muted" },
  CANCELLED: { label: "已撤回", tone: "muted" },
};

export const REPORT_STATUS: StatusMap = {
  OPEN: { label: "待处理", tone: "warn" },
  RESOLVED: { label: "已处理", tone: "ok" },
  DISMISSED: { label: "已驳回", tone: "muted" },
};

export const LEAD_STATUS: StatusMap = {
  NEW: { label: "新线索", tone: "warn" },
  CONTACTED: { label: "已联系", tone: "info" },
  WON: { label: "已成交", tone: "ok" },
  CLOSED: { label: "已关闭", tone: "muted" },
};

export const RESTOCK_STATUS: StatusMap = {
  OPEN: { label: "等待到货", tone: "warn" },
  NOTIFIED: { label: "已通知", tone: "ok" },
  CLOSED: { label: "已关闭", tone: "muted" },
};

export const PAYOUT_STATUS: StatusMap = {
  PENDING: { label: "待结算", tone: "warn" },
  PAID: { label: "已打款", tone: "ok" },
};

// ───────────────────────── 市场字段 ─────────────────────────

export const COUNTRIES: Record<string, string> = {
  US: "美国", CA: "加拿大", JP: "日本", SG: "新加坡", HK: "中国香港",
  TW: "中国台湾", GB: "英国", DE: "德国", OTHER: "其他",
};

export const MACHINE_TYPES = ["Mac mini", "MacBook Air", "MacBook Pro", "Mac Studio", "iMac", "其他"];

/** 芯片按性能从低到高排列，用于“最低芯片”筛选 */
export const CHIPS = [
  "M1", "M1 Pro", "M1 Max", "M1 Ultra",
  "M2", "M2 Pro", "M2 Max", "M2 Ultra",
  "M3", "M3 Pro", "M3 Max", "M3 Ultra",
  "M4", "M4 Pro", "M4 Max",
  "M5", "M5 Pro", "M5 Max",
  "M6", "M6 Pro", "M6 Max",
];
export function chipRank(chip: string | null | undefined) {
  const i = chip ? CHIPS.indexOf(chip) : -1;
  return i; // -1 表示“其他/未知”
}

export const MEMORY_OPTIONS = [8, 16, 24, 32, 36, 48, 64, 96, 128, 192, 256];
export const STORAGE_OPTIONS = [256, 512, 1024, 2048, 4096, 8192];
export const MIN_MONTH_OPTIONS = [1, 3, 6, 12];

export const ADMIN_ACCESS: Record<string, string> = {
  YES: "提供管理员权限",
  NO: "标准用户",
  NEGOTIABLE: "可商议",
};

export const NETWORK: Record<string, string> = {
  HOME: "家庭宽带",
  OFFICE: "办公网络",
  DATACENTER: "机房",
};

export const REMOTE_METHODS = ["UU", "向日葵", "ToDesk", "RustDesk", "VNC", "SSH", "Parsec", "Jump", "其他"];

export const RESTART: Record<string, string> = {
  YES: "支持远程重启",
  NO: "不支持",
  NEGOTIABLE: "可商议",
  UNSTATED: "未说明",
};

export const AVAILABILITY: Record<string, string> = {
  AVAILABLE: "可咨询",
  FROM_DATE: "预计某日起可咨询",
  FULL: "暂无空位",
};

export const CURRENCY: Record<string, string> = { USD: "USD", CNY: "¥" };

export const COMMUNITY_BOARDS: Record<string, string> = {
  experience: "使用经验",
  network: "网络与连接",
  hosting: "出租经验",
  feedback: "建议反馈",
};

export const FAQ_CATEGORIES: { key: string; label: string }[] = [
  { key: "machine", label: "机器与网络" },
  { key: "usage", label: "日常使用" },
  { key: "billing", label: "付款与停用" },
  { key: "market", label: "租赁市场" },
];

export const REPORT_CATEGORIES: Record<string, string> = {
  FAKE: "虚假或过期信息",
  IMPERSONATION: "冒充他人或官方",
  SPAM: "骚扰或垃圾信息",
  SCAM: "疑似诈骗",
  PRIVACY: "泄露隐私",
  ILLEGAL: "违规内容",
  OTHER: "其他",
};

export const REPORT_TARGETS: Record<string, string> = {
  LISTING: "出租方案",
  WANTED: "求租帖",
  POST: "帖子",
  REPLY: "回复",
  MESSAGE: "私信",
  REVIEW: "评价",
  USER: "用户",
};

/** 市场规则里的数量与频率限制 */
export const MARKET_LIMITS = {
  listingTtlDays: 14,          // 方案确认有效期
  listingConfirmWindowDays: 7, // 到期前多少天内可以确认
  listingReopenDays: 90,       // 关闭后多少天内可重新开放
  maxActiveListings: 3,
  wantedTtlDays: 14,
  wantedReopenDays: 7,
  maxActiveWanted: 2,
  wantedMaxResponses: 20,
  wantedHostDailyResponses: 10,
  newAccountDays: 7,
  newAccountDailyInquiries: 5,
  dailyInquiries: 20,
  dailyTopics: 3,
  topicIntervalMinutes: 10,
  replyIntervalSeconds: 30,
  dailyReplies: 30,
  newAccountDailyReplies: 5,
  postEditMinutes: 30,
  reviewWindowDays: 14,
  messageRetentionDays: 180,
  unansweredHours: 48,
};
