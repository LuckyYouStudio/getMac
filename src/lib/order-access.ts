import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { getCurrentUser } from "./auth";

// 自营订单支持游客下单：订单的 accessToken 记在浏览器的 httpOnly cookie 里，
// 换设备时用 /orders/[id]?t=TOKEN 这条专属链接访问。

const COOKIE = "gm_orders";
const MAX_TOKENS = 30;
const MAX_AGE = 60 * 60 * 24 * 400;

export async function getBrowserOrderTokens(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX_TOKENS) : [];
  } catch {
    return [];
  }
}

/** 把订单记到当前浏览器。只能在 Server Action / Route Handler 里调用 */
export async function rememberOrderToken(token: string) {
  const tokens = await getBrowserOrderTokens();
  if (tokens.includes(token)) return;
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify([token, ...tokens].slice(0, MAX_TOKENS)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** 订单专属链接 */
export function orderLink(order: { id: string; accessToken: string }) {
  return `/orders/${order.id}?t=${order.accessToken}`;
}

/**
 * 当前访问者能否查看/操作该订单：
 * 登录用户本人的订单、本浏览器记过的订单，或带了正确 token 的专属链接。
 */
export async function findViewableOrder(id: string, token?: string | null) {
  const order = await db.order.findUnique({ where: { id }, include: { plan: true, machine: true } });
  if (!order) return null;
  if (token && token === order.accessToken) return order;
  const user = await getCurrentUser();
  if (user && order.userId === user.id) return order;
  if (user?.role === "ADMIN") return order;
  const tokens = await getBrowserOrderTokens();
  if (tokens.includes(order.accessToken)) return order;
  return null;
}

/** 当前访问者的全部订单：登录用户的 + 本浏览器记过的 */
export async function listViewerOrders() {
  const user = await getCurrentUser();
  const tokens = await getBrowserOrderTokens();
  const or = [
    ...(user ? [{ userId: user.id }] : []),
    ...(tokens.length ? [{ accessToken: { in: tokens } }] : []),
  ];
  if (or.length === 0) return [];
  return db.order.findMany({
    where: { OR: or },
    include: { plan: true, machine: true },
    orderBy: { createdAt: "desc" },
  });
}
