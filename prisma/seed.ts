// 初始化演示数据：npm run db:seed（会清空现有数据）
import { PrismaClient, type User } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY = 86400000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

async function main() {
  // 按外键依赖倒序清空
  await db.message.deleteMany();
  await db.inquiry.deleteMany();
  await db.report.deleteMany();
  await db.communityReply.deleteMany();
  await db.communityPost.deleteMany();
  await db.wantedPost.deleteMany();
  await db.listing.deleteMany();
  await db.order.deleteMany();
  await db.machine.deleteMany();
  await db.plan.deleteMany();
  await db.user.deleteMany();
  await db.faq.deleteMany();
  await db.announcement.deleteMany();
  await db.pageView.deleteMany();

  const pw = await bcrypt.hash("admin12345", 10);
  const userPw = await bcrypt.hash("user12345", 10);

  const admin = await db.user.create({
    data: { email: "admin@getmac.test", name: "管理员", passwordHash: pw, role: "ADMIN", hostStatus: "VERIFIED" },
  });
  const demo = await db.user.create({
    data: { email: "demo@getmac.test", name: "演示租客", passwordHash: userPw, wechat: "demo_renter" },
  });

  const hostDefs = [
    ["JQ", "VERIFIED"], ["serenobody", "VERIFIED"], ["Ernst Christopher", "VERIFIED"], ["liuliu", "VERIFIED"],
    ["HHHG", "VERIFIED"], ["小德", "VERIFIED"], ["howard123", "VERIFIED"], ["Bob Zhang", "VERIFIED"],
    ["Iainai", "VERIFIED"], ["nlstudio", "VERIFIED"], ["Youricks", "VERIFIED"], ["Lyman Yuan", "PENDING"],
    ["kat", "VERIFIED"], ["Feng", "VERIFIED"], ["Joey", "VERIFIED"], ["CatEyes", "PENDING"],
  ] as const;
  const hosts: User[] = [];
  for (const [i, [name, hostStatus]] of hostDefs.entries()) {
    hosts.push(
      await db.user.create({
        data: {
          email: `host${i + 1}@getmac.test`,
          name,
          passwordHash: userPw,
          hostStatus,
          hostIntro: "家里常年开着的 Mac mini，有 UPS 和备用网络。",
          createdAt: daysAgo(40 - i),
        },
      }),
    );
  }
  const renters: User[] = [];
  for (let i = 1; i <= 6; i++) {
    renters.push(
      await db.user.create({
        data: { email: `renter${i}@getmac.test`, name: `租客${i}`, passwordHash: userPw, createdAt: daysAgo(20 - i) },
      }),
    );
  }

  // 自营方案
  const economy = await db.plan.create({
    data: { slug: "economy", name: "经济", spec: "Apple M1/M2 · 8GB 或 16GB 统一内存 · 256GB SSD", priceMonthly: 75, summary: "适合一个人、以终端和编辑器为主的日常开发。", sort: 1 },
  });
  const standard = await db.plan.create({
    data: { slug: "standard", name: "标准", badge: "推荐", featured: true, spec: "Apple M4 · 16GB 统一内存 · 256GB SSD", priceMonthly: 109, summary: "适合一到两人，同时跑几个 AI 编程任务也从容。", sort: 2 },
  });
  const pro = await db.plan.create({
    data: { slug: "pro", name: "进阶", spec: "Apple M6 · 16GB 或 24GB 统一内存 · 256GB 起 SSD", priceMonthly: 139, summary: "适合两到四人的团队共用，或要开 Xcode 和模拟器。", sort: 3 },
  });

  const machineDefs: [string, string, string, number, string, string][] = [
    ["Austin", "纽约 · 皇后区", "M2", 16, "economy", "AVAILABLE"],
    ["Boston", "纽约 · 曼哈顿", "M1", 8, "economy", "RENTED"],
    ["Chicago", "纽约 · 布鲁克林", "M4", 16, "standard", "AVAILABLE"],
    ["Denver", "纽约 · 曼哈顿", "M4", 16, "standard", "RENTED"],
    ["Miami", "新泽西 · 泽西城", "M4", 16, "standard", "AVAILABLE"],
    ["Nashville", "纽约 · 皇后区", "M4", 16, "standard", "MAINTENANCE"],
    ["Phoenix", "纽约 · 布鲁克林", "M6", 24, "pro", "AVAILABLE"],
    ["Portland", "纽约 · 曼哈顿", "M6", 16, "pro", "RENTED"],
    ["Seattle", "新泽西 · 泽西城", "M6", 24, "pro", "AVAILABLE"],
  ];
  const planBySlug = { economy, standard, pro } as const;
  const machines: Record<string, { id: string }> = {};
  for (const [name, location, chip, memory, slug, status] of machineDefs) {
    machines[name] = await db.machine.create({
      data: { name, location, chip: `Apple ${chip}`, memory, storage: 256, status, planId: planBySlug[slug as keyof typeof planBySlug].id },
    });
  }

  // 自营订单
  const orderDefs = [
    { user: demo, plan: standard, machine: "Denver", cycle: "QUARTER", months: 3, amount: 311, status: "DELIVERED", days: 12 },
    { user: renters[0], plan: economy, machine: "Boston", cycle: "MONTH", months: 1, amount: 75, status: "DELIVERED", days: 9 },
    { user: renters[1], plan: pro, machine: "Portland", cycle: "YEAR", months: 12, amount: 1468, status: "DELIVERED", days: 30 },
    { user: renters[2], plan: standard, machine: null, cycle: "MONTH", months: 1, amount: 109, status: "PROVISIONING", days: 1 },
    { user: renters[3], plan: pro, machine: null, cycle: "QUARTER", months: 3, amount: 396, status: "PAID", days: 0 },
    { user: renters[4], plan: economy, machine: null, cycle: "MONTH", months: 1, amount: 75, status: "CANCELLED", days: 5 },
    { user: renters[5], plan: standard, machine: null, cycle: "MONTH", months: 1, amount: 109, status: "PENDING", days: 0 },
  ];
  for (const [i, o] of orderDefs.entries()) {
    const created = daysAgo(o.days);
    const paid = ["PAID", "PROVISIONING", "DELIVERED"].includes(o.status);
    const delivered = o.status === "DELIVERED";
    await db.order.create({
      data: {
        no: `GM2026${String(1001 + i)}`,
        userId: o.user.id,
        planId: o.plan.id,
        machineId: o.machine ? machines[o.machine].id : null,
        preferredName: o.machine ?? undefined,
        cycle: o.cycle,
        months: o.months,
        amount: o.amount,
        deliveryEmail: o.user.email,
        status: o.status,
        createdAt: created,
        reserveUntil: new Date(created.getTime() + 30 * 60000),
        paidAt: paid ? created : null,
        startAt: delivered ? created : null,
        endAt: delivered ? new Date(created.getTime() + o.months * 30 * DAY) : null,
        deliveryInfo: delivered
          ? `UU 远程设备码：${Math.floor(100000000 + Math.random() * 900000000)}\n临时密码：已发送至交付邮箱\n机器所在城市：纽约`
          : null,
      },
    });
  }

  // C2C 出租方案
  const L = (
    hostIdx: number, title: string, country: string, region: string | null, city: string | null,
    deviceModel: string, memory: number, storage: number, adminAccess: string, network: string,
    currency: string, price: number, minMonths: number, firstPayment: number, deposit: number, days: number,
    status = "PUBLISHED",
  ) => ({
    hostId: hosts[hostIdx].id, title, country, region, city, deviceModel, memory, storage, adminAccess, network,
    currency, price, minMonths, firstPayment, deposit, status,
    views: Math.floor(Math.random() * 400) + 20,
    description:
      "机器 24 小时开机，接 UPS。交付方式支持 UU 远程 / Tailscale / SSH，首次连接我会远程陪同调试。\n\n不允许挖矿、刷量、违法用途；到期后整盘抹除。",
    confirmedAt: daysAgo(days),
    createdAt: daysAgo(days + 5),
  });
  const listingData = [
    L(0, "Mac mini M4 16G 旧金山", "美国", "加利福尼亚州", "旧金山", "Mac mini M4", 16, 256, "YES", "HOME", "USD", 108, 1, 0, 0, 0),
    L(1, "MacBook Air M2 8G 新加坡", "新加坡", null, "新加坡", "MacBook Air M2", 8, 256, "NO", "HOME", "USD", 40, 1, 40, 0, 1),
    L(2, "Mac mini M6 16GB 阿肯色", "美国", "阿肯色州", "Huntsville", "Mac mini M6", 16, 256, "YES", "HOME", "USD", 100, 1, 100, 100, 1),
    L(3, "Mac mini M6 16GB 老挝万象", "老挝", null, "万象", "Mac mini M6", 16, 256, "YES", "HOME", "USD", 100, 1, 100, 100, 1),
    L(4, "Mac mini M4 16G+256G 美国东岸", "美国", "肯塔基州", null, "Mac mini M4", 16, 256, "NEGOTIABLE", "HOME", "USD", 108, 1, 108, 0, 1),
    L(5, "Mac mini M1 8G 慕尼黑", "德国", "巴伐利亚", "慕尼黑", "Mac mini M1", 8, 256, "YES", "HOME", "CNY", 188, 1, 188, 0, 2),
    L(6, "Mac mini M6 32GB/512GB 台北 · 与北京同时区", "中国台湾", null, "台北", "Mac mini M6", 32, 512, "NEGOTIABLE", "HOME", "USD", 99, 1, 99, 0, 2),
    L(7, "Mac mini M6 美中路易斯安那", "美国", "路易斯安那州", null, "Mac mini M6", 16, 256, "YES", "HOME", "CNY", 849, 1, 849, 500, 2),
    L(8, "Mac mini M6 16GB 伦敦", "英国", null, "伦敦", "Mac mini M6", 16, 256, "YES", "HOME", "CNY", 699, 1, 699, 699, 3),
    L(9, "Mac mini M4 16GB 西雅图 · 办公网络", "美国", "华盛顿州", "西雅图", "Mac mini M4", 16, 256, "YES", "OFFICE", "USD", 100, 3, 150, 150, 3),
    L(10, "Mac mini M6 16g 西雅图", "美国", "华盛顿州", null, "Mac mini M6", 16, 256, "YES", "HOME", "USD", 119, 1, 119, 0, 3),
    L(11, "2020 Mac mini M1 8GB 波士顿", "美国", "马萨诸塞州", "波士顿", "Mac mini M1", 8, 256, "NEGOTIABLE", "HOME", "USD", 80, 1, 80, 80, 4, "PENDING"),
    L(12, "Mac mini M4 16GB 波士顿", "美国", "马萨诸塞州", "波士顿", "Mac mini M4", 16, 256, "NEGOTIABLE", "OFFICE", "USD", 100, 3, 150, 0, 5),
    L(13, "Mac mini M4 16g 台北", "中国台湾", null, "台北", "Mac mini M4", 16, 256, "YES", "OFFICE", "USD", 120, 1, 120, 0, 5),
    L(14, "Mac mini M4 16GB 德州 Austin", "美国", "得克萨斯州", "Austin", "Mac mini M4", 16, 256, "NEGOTIABLE", "HOME", "USD", 109, 1, 109, 0, 5),
    L(15, "Mac mini M2 Pro 16GB 蒙特利尔", "加拿大", "魁北克", "蒙特利尔", "Mac mini M2 Pro", 16, 512, "NO", "HOME", "USD", 77, 1, 77, 70, 5, "PENDING"),
    L(0, "Mac Studio M2 Max 32G 洛杉矶", "美国", "加利福尼亚州", "洛杉矶", "Mac Studio", 32, 1024, "YES", "DATACENTER", "USD", 199, 1, 199, 100, 6),
    L(4, "Mac mini M4 16g 美西", "美国", "华盛顿州", null, "Mac mini M4", 16, 256, "NEGOTIABLE", "HOME", "USD", 110, 3, 360, 0, 6),
    L(13, "Mac mini M6 16GB 纽约", "美国", "纽约州", "纽约", "Mac mini M6", 16, 256, "YES", "HOME", "USD", 118, 1, 118, 0, 8),
    L(6, "MacBook Pro M4 32G 东京", "日本", null, "东京", "MacBook Pro M4", 32, 512, "NO", "OFFICE", "CNY", 899, 1, 899, 0, 9),
    L(8, "Mac mini M2 8G 曼彻斯特", "英国", null, "曼彻斯特", "Mac mini M2", 8, 256, "YES", "HOME", "CNY", 399, 1, 399, 0, 12, "OFFLINE"),
    L(2, "代挂 VPN 的 Mac（已拒绝示例）", "美国", null, null, "Mac mini M4", 16, 256, "YES", "HOME", "USD", 60, 1, 60, 0, 3, "REJECTED"),
  ];
  const listings: { id: string }[] = [];
  for (const d of listingData) listings.push(await db.listing.create({ data: d }));
  await db.listing.update({ where: { id: listings[21].id }, data: { rejectReason: "方案描述包含代开第三方账号/网络服务，违反市场规则第 3 条。" } });

  // 求租
  const wantedDefs = [
    [demo, "求租美西 Mac mini M4 16G，跑 Xcode 打包", "美国西部", "USD 100 以内/月", "需要管理员权限，长期租，最好有固定 IP。"],
    [renters[0], "求一台日本或新加坡的 Mac，低延迟", "日本/新加坡", "¥ 600/月", "主要 SSH + tmux，内存 16G 以上。"],
    [renters[1], "团队 3 人共用，求 Mac Studio", "不限", "USD 200/月", "要能同时开多个模拟器，季付可以。"],
    [renters[2], "短租一个月 Mac mini 测试 App 上架", "美国", "USD 80", "只用一个月，标准用户也行。"],
  ] as const;
  for (const [i, [u, title, region, budget, req]] of wantedDefs.entries()) {
    await db.wantedPost.create({ data: { userId: u.id, title, region, budget, requirements: req, createdAt: daysAgo(i * 2) } });
  }

  // 交流区
  const post1 = await db.communityPost.create({
    data: { userId: admin.id, title: "【置顶】第一次租第三方设备，先读这 6 个问题", body: "1. 机器在哪个城市、用什么网络？\n2. 是否提供管理员权限？\n3. 交付方式是 UU、Tailscale 还是 SSH？\n4. 停电/死机谁来处理、多久恢复？\n5. 到期后数据怎么处理？\n6. 首期和押金怎么退？\n\n第一次合作请按月付，不要大额预付。", pinned: true, createdAt: daysAgo(20) },
  });
  const post2 = await db.communityPost.create({
    data: { userId: renters[0].id, title: "从上海连旧金山的 Mac，mosh 体验分享", body: "终端里用 mosh 基本无感，远程桌面能感觉到 0.2 秒左右的拖影，写代码完全够用。", createdAt: daysAgo(4) },
  });
  await db.communityReply.createMany({
    data: [
      { postId: post1.id, userId: renters[1].id, body: "很实用，收藏了。", createdAt: daysAgo(18) },
      { postId: post2.id, userId: hosts[0].id, body: "推荐再配个 tmux，断线不丢会话。", createdAt: daysAgo(3) },
    ],
  });

  // 咨询会话
  const inq = await db.inquiry.create({
    data: { listingId: listings[0].id, renterId: demo.id, hostId: hosts[0].id },
  });
  await db.message.createMany({
    data: [
      { inquiryId: inq.id, senderId: demo.id, body: "你好，这台机器能装 Docker 吗？晚上会不会关机？", createdAt: daysAgo(1), read: true },
      { inquiryId: inq.id, senderId: hosts[0].id, body: "可以装，管理员权限给你。机器 24 小时开着，接了 UPS。", createdAt: daysAgo(0.9) },
    ],
  });

  // 举报
  await db.report.create({
    data: { reporterId: renters[3].id, targetType: "LISTING", targetId: listings[3].id, reason: "价格写的 USD 100，私聊时要求先付半年。" },
  });

  // FAQ
  const faqs = [
    ["自营", "是虚拟机吗？", "不是。每台都是真实的 Mac mini 实体机，租期内只给你一个团队独享，不和别人共用。"],
    ["自营", "从国内连过去，延迟大概多少？", "北京到纽约的往返延迟一般在 180–250 ms。远程桌面能感觉到轻微拖影；终端里用 SSH + tmux 或 mosh 几乎无感。"],
    ["自营", "可以用来跑 AI 编程工具吗？", "可以，这正是最适合的场景。你布置任务后离开，AI 在远程机器上跑几分钟到几十分钟，延迟只影响你打字和点击的那几下。"],
    ["自营", "怎么停用？能退款吗？", "到期不续即停，不需要单独申请。开通前可全额退款；开通后按未使用的整月比例退款，详见服务条款。"],
    ["自营", "需要押金吗？", "自营方案不设押金，月付、季付、年付都按周期预付。"],
    ["自营", "你们会看我的文件吗？", "不会。我们不录屏、不记录按键，进入你的环境做维护之前一定先征得你的同意，并保留操作记录。"],
    ["市场", "租赁市场的设备是平台的吗？", "不是。市场里的方案由第三方房东发布，平台只提供信息展示和站内咨询，不经手租金，也不对交付和售后负责。"],
    ["市场", "第三方设备怎么付款？", "由你和房东自行约定。建议第一次合作先按月付，不要大额预付，付款前在站内问清配置和交付方式。"],
    ["市场", "怎么成为房东？", "在“我要出租”页面提交房东认证申请，审核通过后就可以发布方案。每个方案都需要经过平台审核才会公开展示。"],
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
      await db.pageView.create({ data: { day: key, path, count: Math.floor((120 - i * 18) * (0.7 + Math.random() * 0.6)) } });
    }
  }

  console.log("Seed 完成：管理员 admin@getmac.test / admin12345，演示用户 demo@getmac.test / user12345");
}

main().finally(() => db.$disconnect());
