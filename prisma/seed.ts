// 初始化演示数据：npm run db:seed（会清空现有数据）
import { PrismaClient, type Listing, type User } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY = 86400000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysLater = (n: number) => new Date(Date.now() + n * DAY);
const json = (v: unknown) => JSON.stringify(v);

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
}

async function main() {
  // 按外键依赖倒序清空
  await db.review.deleteMany();
  await db.deal.deleteMany();
  await db.message.deleteMany();
  await db.inquiry.deleteMany();
  await db.block.deleteMany();
  await db.report.deleteMany();
  await db.communityReply.deleteMany();
  await db.communityPost.deleteMany();
  await db.wantedPost.deleteMany();
  await db.listing.deleteMany();
  await db.order.deleteMany();
  await db.restockAlert.deleteMany();
  await db.payout.deleteMany();
  await db.machine.deleteMany();
  await db.plan.deleteMany();
  await db.lead.deleteMany();
  await db.user.deleteMany();
  await db.faq.deleteMany();
  await db.announcement.deleteMany();
  await db.pageView.deleteMany();

  const pw = await bcrypt.hash("admin12345", 10);
  const userPw = await bcrypt.hash("user12345", 10);

  const admin = await db.user.create({
    data: { email: "admin@getmac.test", name: "站务", passwordHash: pw, role: "ADMIN" },
  });
  const demo = await db.user.create({
    data: { email: "demo@getmac.test", name: "演示租客", passwordHash: userPw, wechat: "demo_renter" },
  });
  // 官方房东：托管两台自营机器
  const official = await db.user.create({
    data: {
      email: "official@getmac.test", name: "Queens Mini", passwordHash: userPw,
      officialHost: true, hostAgreedAt: daysAgo(60), payoutInfo: "PayPal: host@example.com",
      bio: "皇后区家里有两台 Mac mini，UPS + 双宽带。", createdAt: daysAgo(70),
    },
  });

  const hostNames = [
    "JQ", "serenobody", "Ernst", "liuliu", "HHHG", "小德", "howard123", "Bob Zhang",
    "Iainai", "nlstudio", "Youricks", "Lyman", "kat", "Feng", "Joey", "CatEyes",
  ];
  const hosts: User[] = [];
  for (const [i, name] of hostNames.entries()) {
    hosts.push(
      await db.user.create({
        data: {
          email: `host${i + 1}@getmac.test`, name, passwordHash: userPw,
          bio: "家里常年开着的 Mac，接了 UPS，有备用网络。",
          createdAt: daysAgo(120 - i * 5),
        },
      }),
    );
  }
  const renters: User[] = [];
  for (let i = 1; i <= 6; i++) {
    renters.push(
      await db.user.create({
        data: { email: `renter${i}@getmac.test`, name: `租客${i}`, passwordHash: userPw, createdAt: daysAgo(30 - i) },
      }),
    );
  }

  // ───────── 自营方案（三个周期各自定价，均为月均价）─────────
  const economy = await db.plan.create({
    data: {
      slug: "economy", name: "经济", spec: "Apple M1/M2 · 8GB 或 16GB 统一内存 · 256GB SSD",
      priceMonth: 79, priceQuarter: 75, priceYear: 69, sort: 1,
      summary: "一个人、以终端和编辑器为主的日常开发。",
      features: json(["实体机独享，完整管理员权限", "常用开发环境预装", "UU 远程交付", "断电 / 死机本地处理", "工单 24 小时内回复"]),
      responseHours: 24, seats: "1 人", xcodeLevel: "可用，模拟器偏慢",
    },
  });
  const standard = await db.plan.create({
    data: {
      slug: "standard", name: "标准", badge: "推荐", featured: true,
      spec: "Apple M4 · 16GB 统一内存 · 256GB SSD",
      priceMonth: 119, priceQuarter: 109, priceYear: 99, sort: 2,
      summary: "一到两人，同时跑几个 AI 编程任务也从容。",
      features: json(["经济档全部内容", "M4 芯片，编译更快", "工单 12 小时内回复"]),
      responseHours: 12, seats: "1–2 人", xcodeLevel: "流畅",
    },
  });
  const pro = await db.plan.create({
    data: {
      slug: "pro", name: "进阶", spec: "Apple M6 · 16GB 或 24GB 统一内存 · 256GB 起 SSD",
      priceMonth: 149, priceQuarter: 139, priceYear: 129, sort: 3,
      summary: "两到四人的团队共用，或要常开 Xcode 和模拟器。",
      features: json(["标准档全部内容", "死机优先处理", "每月一次健康检查", "工单 8 小时内回复"]),
      responseHours: 8, seats: "2–4 人", xcodeLevel: "多开模拟器也流畅",
    },
  });

  // 经济档全部租出，用来演示“缺货 / 到货通知”
  const machineDefs: [string, string, string, number, string, string, User | null][] = [
    ["Austin", "纽约 · 皇后区", "M2", 16, "economy", "RENTED", null],
    ["Boston", "纽约 · 曼哈顿", "M1", 8, "economy", "RENTED", null],
    ["Chicago", "纽约 · 布鲁克林", "M4", 16, "standard", "AVAILABLE", null],
    ["Denver", "纽约 · 曼哈顿", "M4", 16, "standard", "RENTED", null],
    ["Miami", "新泽西 · 泽西城", "M4", 16, "standard", "AVAILABLE", official],
    ["Nashville", "纽约 · 皇后区", "M4", 16, "standard", "MAINTENANCE", null],
    ["Phoenix", "纽约 · 布鲁克林", "M6", 24, "pro", "AVAILABLE", null],
    ["Portland", "纽约 · 曼哈顿", "M6", 16, "pro", "RENTED", official],
    ["Seattle", "新泽西 · 泽西城", "M6", 24, "pro", "AVAILABLE", null],
  ];
  const planBySlug = { economy, standard, pro } as const;
  const machines: Record<string, { id: string }> = {};
  for (const [name, location, chip, memory, slug, status, owner] of machineDefs) {
    machines[name] = await db.machine.create({
      data: {
        name, location, country: "US", city: location.split(" · ")[0], chip: `Apple ${chip}`, memory, storage: 256, status,
        planId: planBySlug[slug as keyof typeof planBySlug].id,
        ownerId: owner?.id,
        heartbeatAt: owner ? new Date(Date.now() - 4 * 60000) : null,
        heartbeatToken: owner ? `hb_${name.toLowerCase()}_demo` : null,
        checklist: owner ? json({ power: true, network: true, sleep: true, autoboot: true, filevault: true, account: true, script: true, submitted: true }) : "{}",
      },
    });
  }
  // 官方房东刚登记、待上架的一台
  await db.machine.create({
    data: {
      name: "Brooklyn", location: "纽约 · 布鲁克林", country: "US", city: "纽约", chip: "Apple M4", memory: 16, storage: 512,
      status: "ONBOARDING", planId: standard.id, ownerId: official.id, heartbeatToken: "hb_brooklyn_demo",
      checklist: json({ power: true, network: true, script: false }),
    },
  });

  // ───────── 自营订单 ─────────
  const orderDefs = [
    { user: demo, plan: standard, machine: "Denver", cycle: "QUARTER", months: 3, status: "DELIVERED", days: 12 },
    { user: renters[0], plan: economy, machine: "Boston", cycle: "MONTH", months: 1, status: "DELIVERED", days: 9 },
    { user: renters[1], plan: pro, machine: "Portland", cycle: "YEAR", months: 12, status: "DELIVERED", days: 40 },
    { user: renters[4], plan: economy, machine: "Austin", cycle: "QUARTER", months: 3, status: "DELIVERED", days: 20 },
    { user: renters[2], plan: standard, machine: "Chicago", cycle: "MONTH", months: 1, status: "PROVISIONING", days: 1 },
    { user: renters[3], plan: pro, machine: "Phoenix", cycle: "QUARTER", months: 3, status: "PAID", days: 0 },
    { user: null, plan: standard, machine: null, cycle: "MONTH", months: 1, status: "CANCELLED", days: 5 },
  ];
  const prices = (p: typeof economy, c: string) => (c === "YEAR" ? p.priceYear : c === "QUARTER" ? p.priceQuarter : p.priceMonth);
  for (const [i, o] of orderDefs.entries()) {
    const created = daysAgo(o.days);
    const paid = ["PAID", "PROVISIONING", "DELIVERED"].includes(o.status);
    const delivered = o.status === "DELIVERED";
    await db.order.create({
      data: {
        no: `GM2026${String(1001 + i)}`,
        userId: o.user?.id,
        contactName: o.user?.name ?? "游客",
        planId: o.plan.id,
        machineId: o.machine ? machines[o.machine].id : null,
        preferredName: o.machine ?? undefined,
        cycle: o.cycle,
        months: o.months,
        amount: prices(o.plan, o.cycle) * o.months,
        deliveryEmail: o.user?.email ?? "guest@example.com",
        status: o.status,
        createdAt: created,
        reserveUntil: new Date(created.getTime() + 30 * 60000),
        paidAt: paid ? created : null,
        startAt: delivered ? created : null,
        endAt: delivered ? addMonths(created, o.months) : null,
        deliveryInfo: delivered
          ? `UU 远程设备码：${100000000 + i * 7654321}\n临时密码：已发送至交付邮箱，首次登录后请立即修改\n机器所在城市：纽约`
          : null,
      },
    });
  }
  // Chicago、Phoenix 已被付款订单占用
  await db.machine.updateMany({ where: { name: { in: ["Chicago", "Phoenix"] } }, data: { status: "RESERVED" } });

  await db.restockAlert.createMany({
    data: [
      { planId: economy.id, email: "wait1@example.com", usage: "个人写 Swift，想要最便宜的", createdAt: daysAgo(2) },
      { planId: economy.id, wechat: "dev_wait", usage: "跑 Claude Code", createdAt: daysAgo(1) },
    ],
  });

  await db.lead.createMany({
    data: [
      { seq: 1, name: "王先生", email: "team@example.com", teamSize: "5–10 人", plan: "custom", chip: "M5 Pro", memory: "48GB", storage: "1TB", qty: 2, term: "12 个月", usage: "iOS 团队 CI 打包", createdAt: daysAgo(3) },
      { seq: 2, name: "Lisa", wechat: "lisa_dev", teamSize: "1 人", plan: "unsure", usage: "不确定选哪档，主要用 Xcode", status: "CONTACTED", createdAt: daysAgo(6) },
    ],
  });

  // 官方房东结算
  const lastMonth = addMonths(new Date(), -1);
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  await db.payout.create({ data: { hostId: official.id, month: ym(addMonths(new Date(), -2)), gross: 129 + 109, fee: 60, net: 178, status: "PAID", paidAt: daysAgo(25) } });
  await db.payout.create({ data: { hostId: official.id, month: ym(lastMonth), gross: 129, fee: 30, net: 99, status: "PENDING" } });

  // ───────── C2C 出租方案 ─────────
  type L = {
    h: number; title: string; country: string; region?: string; city?: string; type: string; chip: string;
    mem: number; disk: number; admin: string; net: string; cur: string; price: number; min?: number;
    first?: number; deposit?: number; days: number; status?: string; avail?: string; remote?: string[];
  };
  const mk = (l: L) => {
    const confirmedAt = daysAgo(l.days);
    return {
      hostId: hosts[l.h].id, title: l.title, country: l.country, region: l.region, city: l.city,
      machineType: l.type, chip: l.chip, memory: l.mem, storage: l.disk, osVersion: "macOS 26",
      network: l.net, bandwidth: l.net === "DATACENTER" ? "1G 对称" : "1000M 下 / 40M 上",
      adminAccess: l.admin, remoteMethods: json(l.remote ?? ["UU", "SSH"]), ssh: (l.remote ?? ["SSH"]).includes("SSH"),
      restart: "YES", selfInstall: true,
      currency: l.cur, price: l.price, minMonths: l.min ?? 1, firstPayment: l.first ?? l.price, deposit: l.deposit ?? 0,
      paymentMethods: l.cur === "CNY" ? "支付宝 / 微信" : "PayPal / Wise / USDT",
      supportHours: "北京时间 9:00–23:00", deliveryNotes: "付款后 24 小时内交付，首次连接远程陪同。",
      refundPolicy: "交付后 3 天内连不上全额退款。", dataCleanup: "到期后整盘抹除并重装系统。",
      description: "机器 24 小时开机，接 UPS。不允许挖矿、刷量和违法用途。到期后整盘抹除。",
      availability: l.avail ?? "AVAILABLE",
      availableFrom: l.avail === "FROM_DATE" ? daysLater(7) : null,
      status: l.status ?? "PUBLISHED",
      views: 30 + ((l.h * 37 + l.price) % 400),
      confirmedAt, expiresAt: new Date(confirmedAt.getTime() + 14 * DAY),
      publishedAt: daysAgo(l.days + 10), createdAt: daysAgo(l.days + 10),
    };
  };
  const defs: L[] = [
    { h: 0, title: "Mac mini M4 16G 旧金山", country: "US", region: "加利福尼亚州", city: "旧金山", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 108, first: 0, days: 0 },
    { h: 1, title: "MacBook Air M2 8G 新加坡", country: "SG", city: "新加坡", type: "MacBook Air", chip: "M2", mem: 8, disk: 256, admin: "NO", net: "HOME", cur: "USD", price: 40, days: 1, remote: ["向日葵"] },
    { h: 2, title: "Mac mini M6 16GB 阿肯色", country: "US", region: "阿肯色州", city: "Huntsville", type: "Mac mini", chip: "M6", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 100, deposit: 100, days: 1 },
    { h: 3, title: "Mac mini M6 16GB 老挝万象", country: "OTHER", city: "万象", type: "Mac mini", chip: "M6", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 100, deposit: 100, days: 1, avail: "FROM_DATE" },
    { h: 4, title: "Mac mini M4 16G 美国东岸", country: "US", region: "肯塔基州", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "NEGOTIABLE", net: "HOME", cur: "USD", price: 108, days: 1 },
    { h: 5, title: "Mac mini M1 8G 慕尼黑", country: "DE", region: "巴伐利亚", city: "慕尼黑", type: "Mac mini", chip: "M1", mem: 8, disk: 256, admin: "YES", net: "HOME", cur: "CNY", price: 188, days: 2 },
    { h: 6, title: "Mac mini M6 32GB/512GB 台北 · 与北京同时区", country: "TW", city: "台北", type: "Mac mini", chip: "M6", mem: 32, disk: 512, admin: "NEGOTIABLE", net: "HOME", cur: "USD", price: 99, days: 2 },
    { h: 7, title: "Mac mini M6 美中路易斯安那", country: "US", region: "路易斯安那州", type: "Mac mini", chip: "M6", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "CNY", price: 849, deposit: 500, days: 2 },
    { h: 8, title: "Mac mini M6 16GB 伦敦", country: "GB", city: "伦敦", type: "Mac mini", chip: "M6", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "CNY", price: 699, deposit: 699, days: 3 },
    { h: 9, title: "Mac mini M4 16GB 西雅图 · 办公网络", country: "US", region: "华盛顿州", city: "西雅图", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "YES", net: "OFFICE", cur: "USD", price: 100, min: 3, first: 150, deposit: 150, days: 3 },
    { h: 10, title: "Mac mini M6 16G 西雅图", country: "US", region: "华盛顿州", type: "Mac mini", chip: "M6", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 119, days: 3, avail: "FULL" },
    { h: 11, title: "2020 Mac mini M1 8GB 波士顿", country: "US", region: "马萨诸塞州", city: "波士顿", type: "Mac mini", chip: "M1", mem: 8, disk: 256, admin: "NEGOTIABLE", net: "HOME", cur: "USD", price: 80, deposit: 80, days: 4, status: "NEEDS_CHANGES" },
    { h: 12, title: "Mac mini M4 16GB 波士顿", country: "US", region: "马萨诸塞州", city: "波士顿", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "NEGOTIABLE", net: "OFFICE", cur: "USD", price: 100, min: 3, first: 150, days: 5 },
    { h: 13, title: "Mac mini M4 16G 台北", country: "TW", city: "台北", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "YES", net: "OFFICE", cur: "USD", price: 120, days: 5 },
    { h: 14, title: "Mac mini M4 16GB 德州 Austin", country: "US", region: "得克萨斯州", city: "Austin", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "NEGOTIABLE", net: "HOME", cur: "USD", price: 109, days: 5 },
    { h: 15, title: "Mac mini M2 Pro 16GB 蒙特利尔", country: "CA", region: "魁北克", city: "蒙特利尔", type: "Mac mini", chip: "M2 Pro", mem: 16, disk: 512, admin: "NO", net: "HOME", cur: "USD", price: 77, deposit: 70, days: 5 },
    { h: 0, title: "Mac Studio M2 Max 32G 洛杉矶机房", country: "US", region: "加利福尼亚州", city: "洛杉矶", type: "Mac Studio", chip: "M2 Max", mem: 32, disk: 1024, admin: "YES", net: "DATACENTER", cur: "USD", price: 199, deposit: 100, days: 6, remote: ["SSH", "VNC", "Parsec"] },
    { h: 4, title: "Mac mini M4 16G 美西", country: "US", region: "华盛顿州", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "NEGOTIABLE", net: "HOME", cur: "USD", price: 110, min: 3, first: 330, days: 6 },
    { h: 13, title: "Mac mini M6 16GB 纽约", country: "US", region: "纽约州", city: "纽约", type: "Mac mini", chip: "M6", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 118, days: 8 },
    { h: 6, title: "MacBook Pro M4 Pro 48G 东京", country: "JP", city: "东京", type: "MacBook Pro", chip: "M4 Pro", mem: 48, disk: 1024, admin: "NO", net: "OFFICE", cur: "CNY", price: 899, days: 9 },
    { h: 1, title: "Mac mini M4 Pro 64G 香港", country: "HK", city: "香港", type: "Mac mini", chip: "M4 Pro", mem: 64, disk: 1024, admin: "YES", net: "DATACENTER", cur: "USD", price: 189, days: 10, remote: ["SSH", "RustDesk"] },
    { h: 8, title: "Mac mini M2 8G 曼彻斯特", country: "GB", city: "曼彻斯特", type: "Mac mini", chip: "M2", mem: 8, disk: 256, admin: "YES", net: "HOME", cur: "CNY", price: 399, days: 20, status: "EXPIRED" },
    { h: 9, title: "Mac mini M1 16G 西雅图（已关闭）", country: "US", region: "华盛顿州", type: "Mac mini", chip: "M1", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 70, days: 15, status: "CLOSED" },
    { h: 2, title: "代开海外账号 + Mac（已被下架示例）", country: "US", type: "Mac mini", chip: "M4", mem: 16, disk: 256, admin: "YES", net: "HOME", cur: "USD", price: 60, days: 3, status: "REMOVED" },
    { h: 5, title: "Mac mini M4 24G 法兰克福（草稿）", country: "DE", city: "法兰克福", type: "Mac mini", chip: "M4", mem: 24, disk: 512, admin: "YES", net: "HOME", cur: "USD", price: 115, days: 0, status: "DRAFT" },
  ];
  const listings: Listing[] = [];
  for (const d of defs) listings.push(await db.listing.create({ data: mk(d) }));
  const byTitle = (t: string) => listings.find((l) => l.title.startsWith(t))!;
  await db.listing.update({ where: { id: byTitle("2020 Mac mini").id }, data: { reviewNote: "标题写的 M1 8GB，描述里写 16GB，请统一配置后再提交。" } });
  await db.listing.update({ where: { id: byTitle("代开海外账号").id }, data: { reviewNote: "代开第三方账号，违反市场规则“不得转售账号”一节。" } });
  await db.listing.update({ where: { id: byTitle("Mac mini M1 16G 西雅图").id }, data: { closedAt: daysAgo(2) } });

  // ───────── 求租 ─────────
  const wantedDefs = [
    { u: demo, title: "求美西 Mac mini M4 16G，跑 Xcode 打包", purpose: "iOS 打包与上架", chipMin: "M4", memMin: 16, admin: true, country: "US", region: "西海岸", bMin: 80, bMax: 110, term: 6, days: 0 },
    { u: renters[0], title: "求日本或新加坡的 Mac，低延迟 SSH", purpose: "终端开发", chipMin: "M2", memMin: 16, admin: false, country: "JP", bMax: 90, term: 3, days: 2 },
    { u: renters[1], title: "团队 3 人共用，求 Mac Studio", purpose: "多模拟器测试", chipMin: "M2 Max", memMin: 32, admin: true, country: null, bMin: 150, bMax: 220, term: 3, days: 4 },
    { u: renters[2], title: "短租一个月 Mac mini 测试 App 上架", purpose: "App Store 上架", chipMin: "M1", memMin: 8, admin: false, country: "US", bMax: 80, term: 1, days: 6 },
  ];
  const wanted: { id: string }[] = [];
  for (const w of wantedDefs) {
    const confirmedAt = daysAgo(w.days);
    wanted.push(
      await db.wantedPost.create({
        data: {
          userId: w.u.id, title: w.title, purpose: w.purpose, chipMin: w.chipMin, memMin: w.memMin, adminNeeded: w.admin,
          remoteMethods: json(["UU", "SSH"]), country: w.country, region: w.region, budgetMin: w.bMin, budgetMax: w.bMax,
          startDate: daysLater(5), termMonths: w.term,
          description: "需要 24 小时开机，最好有 UPS。可以先月付试一个月。",
          confirmedAt, expiresAt: new Date(confirmedAt.getTime() + 14 * DAY), createdAt: confirmedAt,
        },
      }),
    );
  }
  await db.wantedPost.create({
    data: {
      userId: renters[3].id, title: "求一台 M1 跑脚本（已租到）", purpose: "自动化脚本", chipMin: "M1", memMin: 8, description: "已经租到了，谢谢各位。",
      status: "FILLED", termMonths: 1, closedAt: daysAgo(3), confirmedAt: daysAgo(12), expiresAt: daysAgo(-2), createdAt: daysAgo(12),
    },
  });

  // ───────── 交流区 ─────────
  const post1 = await db.communityPost.create({
    data: { userId: admin.id, board: "experience", title: "第一次租第三方设备，先读这 6 个问题", body: "1. 机器在哪个城市、用什么网络？\n2. 是否提供管理员权限？\n3. 交付方式是 UU、Tailscale 还是 SSH？\n4. 停电或死机谁来处理、多久恢复？\n5. 到期后数据怎么处理？\n6. 首期和押金怎么退？\n\n第一次合作请按月付，不要大额预付。", pinned: true, createdAt: daysAgo(20) },
  });
  const post2 = await db.communityPost.create({
    data: { userId: renters[0].id, board: "network", title: "从上海连旧金山的 Mac，mosh 体验分享", body: "终端里用 mosh 基本无感，远程桌面能感觉到 0.2 秒左右的拖影，写代码完全够用。", createdAt: daysAgo(4) },
  });
  await db.communityPost.create({
    data: { userId: hosts[2].id, board: "hosting", title: "出租前我做的 5 件安全设置", body: "单独建一个管理员账号给租客，自己的数据放外接盘；关掉“查找”；开防火墙；路由器给这台机器单独 VLAN；UPS 必备。", createdAt: daysAgo(6) },
  });
  await db.communityPost.create({
    data: { userId: renters[5].id, board: "feedback", title: "建议：求租帖可以按预算排序", body: "希望能按预算从高到低看。", status: "PENDING", createdAt: daysAgo(0) },
  });
  await db.communityReply.createMany({
    data: [
      { postId: post1.id, userId: renters[1].id, body: "很实用，收藏了。", createdAt: daysAgo(18) },
      { postId: post2.id, userId: hosts[0].id, body: "推荐再配个 tmux，断线不丢会话。", createdAt: daysAgo(3) },
    ],
  });

  // ───────── 对话、成交、评价 ─────────
  const snap = (l: (typeof listings)[number]) =>
    json({ title: l.title, price: l.price, currency: l.currency, minMonths: l.minMonths, firstPayment: l.firstPayment, deposit: l.deposit, extraFees: l.extraFees });
  const sf = listings[0];
  const inq = await db.inquiry.create({
    data: {
      listingId: sf.id, renterId: demo.id, hostId: hosts[0].id,
      purpose: "跑 AI 编程任务", startMode: "ASAP", term: "3 个月", listingSnapshot: snap(sf),
      hostRepliedAt: daysAgo(0.9), createdAt: daysAgo(1),
    },
  });
  await db.message.createMany({
    data: [
      { inquiryId: inq.id, senderId: demo.id, body: "你好，这台机器能装 Docker 吗？晚上会不会关机？", createdAt: daysAgo(1), read: true },
      { inquiryId: inq.id, senderId: hosts[0].id, body: "可以装，管理员权限给你。机器 24 小时开着，接了 UPS。", createdAt: daysAgo(0.9) },
    ],
  });
  // 一单已成交并互评
  const nyc = byTitle("Mac mini M6 16GB 纽约");
  const inq2 = await db.inquiry.create({
    data: { listingId: nyc.id, renterId: renters[0].id, hostId: hosts[13].id, purpose: "日常开发", startMode: "ASAP", term: "1 个月", listingSnapshot: snap(nyc), hostRepliedAt: daysAgo(29), createdAt: daysAgo(30) },
  });
  await db.message.createMany({
    data: [
      { inquiryId: inq2.id, senderId: renters[0].id, body: "想租一个月试试。", createdAt: daysAgo(30), read: true },
      { inquiryId: inq2.id, senderId: hosts[13].id, body: "可以，今晚就能交付。", createdAt: daysAgo(29), read: true },
    ],
  });
  const deal = await db.deal.create({
    data: { inquiryId: inq2.id, proposerId: hosts[13].id, status: "CONFIRMED", confirmedAt: daysAgo(28), hostDelivered: true, renterConnected: "YES", createdAt: daysAgo(28) },
  });
  await db.review.createMany({
    data: [
      { dealId: deal.id, authorId: renters[0].id, targetId: hosts[13].id, rating: 5, body: "交付很快，机器稳定。", publishedAt: daysAgo(20), createdAt: daysAgo(21) },
      { dealId: deal.id, authorId: hosts[13].id, targetId: renters[0].id, rating: 5, body: "沟通顺畅，按时付款。", publishedAt: daysAgo(20), createdAt: daysAgo(20) },
    ],
  });
  // 房东回应求租
  await db.inquiry.create({
    data: {
      wantedId: wanted[0].id, renterId: demo.id, hostId: hosts[14].id, createdAt: daysAgo(0.5),
      messages: { create: [{ senderId: hosts[14].id, body: "我在 Austin 有台 M4 16G，可以给管理员权限，月租 109 美元，有兴趣可以看看我的方案。", createdAt: daysAgo(0.5) }] },
    },
  });

  // 举报
  await db.report.create({
    data: { reporterId: renters[3].id, targetType: "LISTING", targetId: byTitle("Mac mini M6 16GB 老挝").id, category: "SCAM", reason: "价格写的 USD 100，私聊时要求先付半年。" },
  });

  // ───────── FAQ ─────────
  const faqs: [string, string, string][] = [
    ["machine", "是虚拟机吗？", "不是。每台都是真实的 Mac mini 实体机，租期内只给你一个团队独享，不和别人共用。"],
    ["machine", "机器放在哪里？", "在纽约和新泽西的住宅或办公室里，接 UPS 和家用光纤。交付邮件会写明机器所在城市。"],
    ["machine", "会一直开着吗？", "会。机器设置为永不睡眠，断电来电后自动开机；死机由我们在本地重启。"],
    ["machine", "从国内连过去，延迟大概多少？", "北京到纽约的往返延迟一般在 180–250 ms。远程桌面能感觉到轻微拖影；终端里用 SSH + tmux 或 mosh 几乎无感。"],
    ["machine", "连接安全吗？", "UU 远程走加密通道。我们不录屏、不记录按键，进入你的环境做维护前一定先征得你同意，并保留操作记录。"],
    ["usage", "可以用来跑 AI 编程工具吗？", "可以，这正是最适合的场景。你布置任务后离开，AI 在远程机器上跑几分钟到几十分钟，延迟只影响你打字和点击的那几下。"],
    ["usage", "几个人能一起用？", "一台机器最多可以建 6 个团队成员账号。经济档建议 1 人，标准档 1–2 人，进阶档 2–4 人。"],
    ["usage", "能装 Xcode 吗？", "能。你有完整管理员权限，Xcode 用你自己的 Apple ID 从 App Store 安装。"],
    ["usage", "你们能保证第三方服务可用吗？", "不能。我们只负责机器和网络。你使用的第三方服务由你自己注册和付费，可用性由服务方决定。"],
    ["usage", "数据会备份吗？", "默认不备份，也不浏览你的文件。重要数据请用 Git 或你自己的云盘同步。"],
    ["billing", "付款后多久能用？", "付款后 3 个工作日内交付，通常当天或次日。"],
    ["billing", "怎么付款？", "支持银行卡和支付宝，由 Stripe 处理。账单上显示的商家名为 GETMAC REMOTE。"],
    ["billing", "需要押金吗？", "自营方案不设押金，月付、季付、年付都按周期预付。"],
    ["billing", "会自动续费吗？", "新订单默认开启自动续费，你可以在订单页随时关闭。关闭后到期即停，不会再扣款。"],
    ["billing", "怎么停用？能退款吗？", "到期不续即停，不需要单独申请。交付前可全额退款；交付后 72 小时内因我们的原因无法使用，全额退款；自行提前停用不退剩余费用。"],
    ["billing", "能升级配置吗？", "可以随时升级到更高一档，差价按剩余天数折算，联系我们处理。"],
    ["billing", "能开发票吗？", "可以提供 Stripe 收据（Receipt）。需要其他票据请发邮件联系我们。"],
    ["billing", "能试用吗？", "不提供免费试用，建议先选月付，不满意到期不续即可。"],
    ["market", "租赁市场的设备是平台的吗？", "不是。市场里的方案由第三方房东发布，平台只提供信息展示和站内对话，不经手租金，也不对交付和售后负责。"],
    ["market", "第三方设备怎么付款？", "由你和房东自行约定。建议第一次合作先按月付，不要大额预付，付款前在站内问清配置和交付方式。"],
    ["market", "怎么在市场出租自己的 Mac？", "登录后即可免费发布方案，发布后立即展示，平台事后复查。每 14 天需要确认一次仍可租，否则自动过期。"],
  ];
  for (const [i, [category, question, answer]] of faqs.entries()) {
    await db.faq.create({ data: { category, question, answer, sort: i } });
  }

  await db.announcement.create({
    data: { title: "西雅图、凤凰城两台 M6 已到货", body: "进阶档新增两台 M6 24GB，现货有限，先付先得。" },
  });

  // 近 14 天的浏览量
  const paths = ["/", "/pricing", "/market", "/market/listing", "/faq"];
  for (let d = 13; d >= 0; d--) {
    const day = daysAgo(d);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    for (const [i, path] of paths.entries()) {
      await db.pageView.create({ data: { day: key, path, count: Math.floor((120 - i * 18) * (0.7 + ((d * 7 + i * 13) % 10) / 16)) } });
    }
  }

  console.log("Seed 完成：管理员 admin@getmac.test / admin12345，演示用户 demo@getmac.test / user12345，官方房东 official@getmac.test / user12345");
}

main().finally(() => db.$disconnect());
