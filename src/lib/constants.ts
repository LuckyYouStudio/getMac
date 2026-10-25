// 各状态字段的取值与中文标签。前后台共用。

export const SITE = {
  name: "GetMac",
  slogan: "你的远程 Mac，有人照看",
  email: "shuangliu.cad@gmail.com",
  wechat: "leahfather",
  usdToCny: 7.0,
};

/** 自营机器的城市名，用于“给机器起名” */
export const CITY_NAMES = [
  "Austin", "Boston", "Chicago", "Denver", "Miami",
  "Nashville", "Phoenix", "Portland", "Seattle",
] as const;

export const CYCLES = {
  MONTH: { label: "月付", months: 1, discount: 0 },
  QUARTER: { label: "季付", months: 3, discount: 0.05 },
  YEAR: { label: "年付", months: 12, discount: 0.12 },
} as const;
export type Cycle = keyof typeof CYCLES;

/** 计算某周期的总价（美元，取整） */
export function cycleTotal(priceMonthly: number, cycle: Cycle) {
  const c = CYCLES[cycle];
  return Math.round(priceMonthly * c.months * (1 - c.discount));
}

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "待付款", tone: "warn" },
  PAID: { label: "已付款", tone: "info" },
  PROVISIONING: { label: "配机中", tone: "info" },
  DELIVERED: { label: "使用中", tone: "ok" },
  EXPIRED: { label: "已到期", tone: "muted" },
  CANCELLED: { label: "已取消", tone: "muted" },
  REFUNDED: { label: "已退款", tone: "muted" },
};

export const MACHINE_STATUS: Record<string, { label: string; tone: Tone }> = {
  AVAILABLE: { label: "空闲", tone: "ok" },
  RESERVED: { label: "已保留", tone: "warn" },
  RENTED: { label: "出租中", tone: "info" },
  MAINTENANCE: { label: "维护中", tone: "danger" },
};

export const LISTING_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "待审核", tone: "warn" },
  PUBLISHED: { label: "发布中", tone: "ok" },
  REJECTED: { label: "未通过", tone: "danger" },
  OFFLINE: { label: "已下架", tone: "muted" },
};

export const HOST_STATUS: Record<string, { label: string; tone: Tone }> = {
  NONE: { label: "普通用户", tone: "muted" },
  PENDING: { label: "房东审核中", tone: "warn" },
  VERIFIED: { label: "认证房东", tone: "ok" },
  REJECTED: { label: "认证未通过", tone: "danger" },
};

export const WANTED_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "求租中", tone: "ok" },
  CLOSED: { label: "已找到", tone: "muted" },
  HIDDEN: { label: "已隐藏", tone: "danger" },
};

export const REPORT_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "待处理", tone: "warn" },
  RESOLVED: { label: "已处理", tone: "ok" },
  DISMISSED: { label: "已驳回", tone: "muted" },
};

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

export const CURRENCY: Record<string, string> = { USD: "USD", CNY: "¥" };

export const DEVICE_MODELS = [
  "Mac mini M1", "Mac mini M2", "Mac mini M2 Pro", "Mac mini M4", "Mac mini M4 Pro",
  "Mac mini M6", "Mac Studio", "MacBook Air M2", "MacBook Pro M4", "其他",
];

export type Tone = "ok" | "warn" | "info" | "danger" | "muted";
