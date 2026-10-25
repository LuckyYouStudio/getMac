// 公开文本（标题、描述、昵称、简介、帖子）里不允许留联系方式，联系一律走站内对话。

const PATTERNS: { label: string; re: RegExp }[] = [
  { label: "邮箱", re: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { label: "手机号", re: /(?:\+?\d[\d\s-]{8,}\d)/ },
  { label: "微信号", re: /(?:微信|weixin|wechat|vx|v信|wx)\s*[:：号]?\s*[a-zA-Z][\w-]{5,19}/i },
  { label: "QQ 号", re: /(?:qq|扣扣)\s*[:：号]?\s*\d{5,11}/i },
  { label: "Telegram", re: /(?:t\.me\/|telegram|tg\s*[:：])\s*@?\w{4,}/i },
  { label: "IP 地址", re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
  { label: "@账号", re: /(?:^|\s)@[a-zA-Z]\w{3,}/ },
];

/** 返回命中的联系方式类型；没有命中返回 null */
export function findContactInfo(...texts: (string | null | undefined)[]): string | null {
  const s = texts.filter(Boolean).join("\n");
  for (const p of PATTERNS) if (p.re.test(s)) return p.label;
  return null;
}

/** 文本里是否含链接（社区帖子含链接需审核） */
export function hasLink(text: string) {
  return /https?:\/\/|www\.|\.(?:com|cn|net|org|io|me)\b/i.test(text);
}

/** 昵称里不允许冒充官方 */
export function isReservedName(name: string) {
  return /官方|客服|管理员|admin|getmac/i.test(name);
}
