# GetMac · 远程 Mac 租赁 + C2C 租赁市场

参考 myusmini.com 的业务形态做的原创实现：

- **自营租赁**：三档 Mac mini 方案（月 / 季 / 年付），选机器名 → 下单保留 30 分钟 → 付款 → 配机 → 交付连接信息。
- **C2C 租赁市场**：认证房东发布出租方案（平台审核后上架），租客筛选、站内咨询、举报；求租帖、交流区。平台不经手租金。
- **后台管理**：数据看板、自营设备 / 方案 / 订单、方案审核、求租 / 举报 / 交流区 / 咨询记录、用户与房东认证、FAQ / 公告。

## 技术栈

Next.js 15（App Router，Server Actions）· TypeScript · Tailwind CSS 4 · Prisma 6 + SQLite（可换 Postgres）· jose 会话 Cookie · bcrypt。

## 本地运行

```bash
npm install
cp .env.example .env      # 修改 AUTH_SECRET
npm run setup             # 建表 + 写入演示数据（会清空数据库）
npm run dev               # http://localhost:3000
```

演示账号（来自 `prisma/seed.ts`）：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | admin@getmac.test | admin12345 |
| 普通用户 | demo@getmac.test | user12345 |
| 房东 | host1@getmac.test … host16@getmac.test | user12345 |

后台入口：`/admin`（需管理员账号）。

## 支付

当前是**模拟支付**：订单页点“模拟支付”即把订单标记为已付款。接入真实支付时，搜索代码中的 `TODO: 接入真实支付`，在那里创建 Stripe Checkout / 支付宝订单，并用支付回调（webhook）把订单改为 `PAID`。

## 目录

```
prisma/schema.prisma      数据模型（状态取值见 src/lib/constants.ts）
prisma/seed.ts            演示数据
src/lib/                  db、登录会话、常量、格式化、浏览统计
src/components/           共用 UI
src/app/(site)/           前台：首页、方案、下单、订单、市场、消息、账户、指南…
src/app/admin/            后台管理
```

## 上线前

- 把 `DATABASE_URL` 换成 Postgres（schema 里 `provider` 改为 `postgresql`），`AUTH_SECRET` 换成随机长串。
- 接入真实支付与邮件发送（交付邮件、订单通知）。
- 演示账号仅供本地使用，上线前删除或改密码。
