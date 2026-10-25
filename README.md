# GetMac · 远程 Mac 租赁 + C2C 租赁市场

参考 myusmini.com 的业务形态做的原创实现：

- **自营租赁**：三档 Mac mini 方案，月 / 季 / 年付各自定价。可以游客下单，也可以登录下单；下单时锁定一台空闲机器保留 30 分钟。缺货时可以登记到货通知。订单页可以开关自动续费、原单续费、交付前退款。
- **官方房东计划**：`/join` 有收益计算器和开通入口，`/host-agreement` 是协议，`/ops` 是房东后台（登记机器、上架清单、心跳脚本、结算、收款信息）。机器心跳上报接口是 `POST /api/heartbeat`。
- **C2C 租赁市场**：
  - 登录即可发布方案，立即展示，平台事后复查。方案每 14 天确认一次，否则自动过期。
  - 有多条件筛选、房东主页、结构化咨询（带报价快照）。
  - 求租帖支持房东回应。
  - 站内对话支持确认成交、交付记录和互评，也可以拉黑、举报。
  - 交流区分版块，新账号或带链接的帖子先审后发。
  - 有市场规则页。
- **内容**：使用指南、设置手册、选购指南（7 篇）、FAQ、联系我们和定制需求、服务条款、隐私政策。
- **后台管理**：
  - 数据看板。
  - 自营业务：设备（含官方房东验收）、方案、订单、到货通知、线索、官方房东结算。
  - 市场：方案复查、求租、举报、交流区审核、对话记录、成交与评价。
  - 用户：受限 / 暂停 / 官方房东。
  - 内容：FAQ、公告。

## 技术栈

Next.js 15（App Router，Server Actions）· TypeScript · Tailwind CSS 4 · Prisma 6 + SQLite（可换 Postgres）· jose 会话 Cookie · bcrypt。

## 本地运行

```bash
npm install
cp .env.example .env      # 修改 AUTH_SECRET
npm run setup             # 建表 + 写入演示数据（会清空数据库）
npm run dev               # http://localhost:3000
```

数据结构有变动时，需要先重置本地库再写入演示数据：

```bash
npx prisma db push --force-reset
npm run db:seed
```

演示账号（来自 `prisma/seed.ts`）：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | admin@getmac.test | admin12345 |
| 普通用户 | demo@getmac.test | user12345 |
| 官方房东 | official@getmac.test | user12345 |
| 市场房东 | host1@getmac.test … host16@getmac.test | user12345 |

后台入口是 `/admin`，需要管理员账号。演示数据里经济档已全部租出，可以用来测试缺货和到货通知。

## 支付

当前是**模拟支付**：订单页点“模拟支付”即视为付款成功。接入真实支付时，搜索代码中的 `TODO: 接入真实支付`，在那里创建 Stripe Checkout，用 webhook 把订单改为 `PAID`。自动续费目前只记录开关状态，接入支付后才会真正扣款。

## 尚未实现

- 发邮件：交付通知、新消息提醒、到期提醒、邮箱验证。
- 邮箱验证码登录（目前是密码登录）。
- 定时任务：过期保留和方案过期都是在页面读取时惰性处理的。

## 目录

```
prisma/schema.prisma      数据模型（状态取值见 src/lib/constants.ts）
prisma/seed.ts            演示数据
src/lib/                  db、会话、常量与计费、日期、联系方式过滤、市场过期、订单访问
src/components/           共用 UI；home / selfserve / market / official / admin / site
src/app/(site)/           前台：首页、方案、下单、订单、市场、房东计划、指南、条款…
src/app/admin/            后台管理
src/app/api/heartbeat/    官方房东机器心跳
```

## 上线前

- 把 `DATABASE_URL` 换成 Postgres（schema 里的 `provider` 改为 `postgresql`），`AUTH_SECRET` 换成随机长串。
- 接入真实支付和发信服务。
- 替换首页 / 联系页里的微信群二维码占位图。
- 删除演示账号，或者改掉它们的密码。
