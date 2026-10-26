import Link from "next/link";
import { MAX_SEATS_PER_MACHINE, MARKET_LIMITS, REFUND_WINDOW_HOURS, RESERVE_MINUTES, SITE } from "@/lib/constants";
import { DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "服务条款" };

const TOC = [
  { id: "t1", label: "1. 服务内容" },
  { id: "t2", label: "2. 使用者与账号" },
  { id: "t3", label: "3. 使用规范" },
  { id: "t4", label: "4. 费用与计费" },
  { id: "renewal", label: "　自动续费" },
  { id: "t5", label: "5. 退款" },
  { id: "t6", label: "6. 维护与故障" },
  { id: "t7", label: "7. 第三方服务" },
  { id: "t8", label: "8. 数据与备份" },
  { id: "t9", label: "9. 租赁市场" },
  { id: "t10", label: "10. 责任限制" },
  { id: "t11", label: "11. 条款变更与适用法律" },
];

export default function TermsPage() {
  return (
    <DocPage eyebrow="法律" title="服务条款" desc="最近更新：2026 年 10 月。下单、注册或使用本站，即表示你同意以下条款。" toc={TOC}>
      <h2 id="t1" className="scroll-mt-24">1. 服务内容</h2>
      <p>
        {SITE.name} 提供两类服务：一是<b>自营远程 Mac</b>，由我们或签约的官方房东提供实体 Mac 设备，租期内供你的团队独享使用；二是<b>租赁市场</b>，供第三方房东发布出租方案、与租客沟通，平台仅提供信息展示与站内对话（见第 9 条）。
      </p>
      <p>自营服务交付的是设备的远程连接信息和一个管理员账号，不包含任何第三方账号或订阅。</p>

      <h2 id="t2" className="scroll-mt-24">2. 使用者与账号</h2>
      <ul>
        <li>你应当年满 18 周岁，或在监护人同意下使用本服务；以公司名义下单的，下单人应有权代表公司。</li>
        <li>自营方案可以不注册直接下单，订单凭证保存在浏览器中，并通过订单专属链接访问。请妥善保管专属链接，持有链接的人可以查看和操作订单。</li>
        <li>一台机器最多可以建 {MAX_SEATS_PER_MACHINE} 个团队成员账号。你应对通过你的机器和账号进行的所有操作负责。</li>
        <li>交付的连接信息请勿公开或转发；如怀疑泄露，请立即修改密码并通知我们。</li>
      </ul>

      <h2 id="t3" className="scroll-mt-24">3. 使用规范</h2>
      <p>不得将设备用于以下用途，否则我们有权立即停机且不予退款：</p>
      <ul>
        <li>挖矿、刷量、批量注册或操纵第三方平台账号；</li>
        <li>发送垃圾信息、网络攻击、扫描或入侵他人系统；</li>
        <li>转售、转租设备，或用于绕过地区限制、制裁及出口管制；</li>
        <li>存储或传播违法内容，或侵犯他人知识产权；</li>
        <li>违反 Apple 软件许可协议的使用方式。</li>
      </ul>

      <h2 id="t4" className="scroll-mt-24">4. 费用与计费</h2>
      <ul>
        <li>价格以美元计价，人民币金额仅为参考。月付、季付、年付各自定价，在开通时一次付清当期费用。</li>
        <li>下单后机器为你保留 {RESERVE_MINUTES} 分钟，期间未付款则订单失效、机器释放。</li>
        <li>租期从交付连接信息当天开始，按自然月计算；月末交付的，到期日为目标月份的最后一天。</li>
        <li>付款由 Stripe 处理，支持银行卡和支付宝，账单上显示的商家名为 {SITE.billingDescriptor}。</li>
        <li>可以随时升级到更高一档，差价按当期剩余天数折算。</li>
        <li>不设押金，不收开通费或流量费。</li>
      </ul>
      <h3 id="renewal" className="scroll-mt-24 font-semibold text-ink">自动续费</h3>
      <ul>
        <li>新订单默认开启自动续费：到期日按当前周期和当时价格续上同一台机器，并从你的付款方式扣款。</li>
        <li>你可以随时在订单页关闭自动续费。关闭后到期即停，不会再扣款；关闭不影响当前租期。</li>
        <li>到期前 7 天，订单页会提示即将续费或即将到期。</li>
        <li>扣款失败的，机器保留 3 天；3 天内仍未续费的，视为到期停用。</li>
      </ul>

      <h2 id="t5" className="scroll-mt-24">5. 退款</h2>
      <ul>
        <li><b>交付前</b>：你可以随时取消，全额退款。</li>
        <li><b>交付后 {REFUND_WINDOW_HOURS} 小时内</b>：如果因为我们的原因（设备、网络、交付信息错误等）始终无法正常使用，全额退款。</li>
        <li><b>自行提前停用</b>：剩余租期不退款。如不想继续，关闭自动续费即可在到期后停止。</li>
        <li>因违反第 3 条被停机的，不予退款。</li>
        <li>退款原路退回，到账时间取决于银行或支付渠道，一般 5–10 个工作日。</li>
      </ul>

      <h2 id="t6" className="scroll-mt-24">6. 维护与故障</h2>
      <ul>
        <li>我们负责设备的供电、网络和硬件，处理断电恢复、死机重启和硬件更换，按方案标注的时效回复工单。</li>
        <li>需要进入你的系统环境做维护时，我们会先征得你的同意，并保留必要的操作记录。</li>
        <li>不可抗力（如大范围停电、网络运营商故障）导致的中断，我们会尽快恢复，但不承担由此产生的间接损失。</li>
      </ul>

      <h2 id="t7" className="scroll-mt-24">7. 第三方服务</h2>
      <p>我们不提供、不代开、不代管任何第三方账号或订阅（包括但不限于 Apple ID、开发者账号、AI 编程工具、云服务、网络服务）。你在设备上使用的第三方服务由你自行注册、付费和管理，其可用性和条款由服务方决定。</p>

      <h2 id="t8" className="scroll-mt-24">8. 数据与备份</h2>
      <ul>
        <li>设备上的数据归你所有。我们默认不备份，也不为日常运营浏览你的文件。</li>
        <li>请自行用 Git、云盘等方式备份重要数据。</li>
        <li>租期结束（含停用、退款）后 3 天内，设备会被整盘抹除并重装系统，数据无法恢复。</li>
        <li>依法需要保全的数据或业务记录，按 <Link className="text-brand hover:underline" href="/privacy">隐私政策</Link> 处理。</li>
      </ul>

      <h2 id="t9" className="scroll-mt-24">9. 租赁市场</h2>
      <ul>
        <li><b>平台角色</b>：租赁市场的方案由第三方房东发布。平台只提供信息展示、站内对话和举报处理，不核验设备，不经手租金，不担保交易，也不对第三方设备的交付和售后负责。</li>
        <li><b>凭据</b>：房东交付的连接信息、租金和押金由双方自行约定。请不要在公开区域发布任何凭据或联系方式。</li>
        <li><b>发布规则</b>：方案发布后立即展示，平台事后复查，可要求修改或下架。每个账号最多 {MARKET_LIMITS.maxActiveListings} 个有效方案，每 {MARKET_LIMITS.listingTtlDays} 天需确认一次仍可租，否则自动过期。具体见 <Link className="text-brand hover:underline" href="/market/rules">市场规则</Link>。</li>
        <li><b>内容权利</b>：你发布的内容归你所有；你授权平台在本站展示这些内容，并在处理举报、纠纷时查看相关对话。</li>
        <li><b>举报与申诉</b>：任何用户都可以举报违规内容，平台会核实处理；对处理结果有异议，可以 <Link className="text-brand hover:underline" href="/apply">联系我们</Link> 申诉。</li>
        <li><b>费用</b>：在租赁市场发布和咨询均免费。</li>
      </ul>

      <h2 id="t10" className="scroll-mt-24">10. 责任限制</h2>
      <p>在法律允许的范围内，我们对任何一笔订单承担的赔偿责任，以该订单你实际支付的金额为上限；不承担利润损失、数据丢失等间接损失。对于租赁市场中第三方房东与租客之间的交易，平台不承担责任。</p>

      <h2 id="t11" className="scroll-mt-24">11. 条款变更与适用法律</h2>
      <p>条款更新时我们会在本页标注日期，重大变更会提前在站内公告。更新后继续使用服务，视为接受新条款；已付费的当期订单按下单时的价格执行。</p>
      <p>本条款适用加拿大不列颠哥伦比亚省法律。如有疑问，请发邮件到 <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>。</p>
    </DocPage>
  );
}
