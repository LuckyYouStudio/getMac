import Link from "next/link";
import { MARKET_LIMITS, SITE } from "@/lib/constants";
import { DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "隐私政策" };

const TOC = [
  { id: "p1", label: "1. 我们收集什么" },
  { id: "p2", label: "2. 访问与隐私边界" },
  { id: "p3", label: "3. 机器运行数据" },
  { id: "p4", label: "4. 服务商与跨境处理" },
  { id: "p5", label: "5. 保存多久" },
  { id: "p6", label: "6. 租赁市场" },
  { id: "p7", label: "7. 你的权利" },
];

export default function PrivacyPage() {
  return (
    <DocPage eyebrow="法律" title="隐私政策" desc="最近更新：2026 年 10 月。我们只收集提供服务所必需的信息。" toc={TOC}>
      <h2 id="p1" className="scroll-mt-24">1. 我们收集什么</h2>
      <ul>
        <li><b>下单信息</b>：称呼、交付邮箱、所选方案和订单记录。</li>
        <li><b>账号信息</b>（如注册）：邮箱、昵称、加盐哈希后的密码，以及你选填的简介和微信号。</li>
        <li><b>联系与到货通知</b>：你在联系表单或到货通知中留下的电话、邮箱或微信，以及用途说明。</li>
        <li><b>付款信息</b>：由 Stripe 直接处理，我们只保存付款状态和金额，不保存卡号。</li>
        <li><b>必要的 Cookie</b>：登录状态、你在本浏览器下过的订单凭证。我们不使用广告追踪 Cookie。</li>
        <li><b>访问统计</b>：按页面和日期汇总的浏览次数，不关联到个人。</li>
      </ul>

      <h2 id="p2" className="scroll-mt-24">2. 访问与隐私边界</h2>
      <ul>
        <li>我们不录屏、不记录按键，不为日常运营浏览你设备上的文件。</li>
        <li>保留一个维护账号，仅在你同意后用于维护，并记录操作时间和内容。</li>
        <li>不向第三方出售或出租你的个人信息。</li>
        <li>正常回收的设备会整盘抹除并重装系统后才交给下一位。</li>
      </ul>

      <h2 id="p3" className="scroll-mt-24">3. 机器运行数据</h2>
      <p>为了及时发现断电、断网和死机，设备会定期上报在线状态、CPU 温度、磁盘剩余空间等运行指标。这些数据不包含你的文件内容、浏览记录或输入内容。</p>

      <h2 id="p4" className="scroll-mt-24">4. 服务商与跨境处理</h2>
      <p>为提供服务，我们会使用以下类型的服务商：支付（Stripe）、邮件发送、网站托管、远程连接工具（网易 UU）。设备和主要数据位于美国，你的信息可能在美国处理。我们只向服务商提供完成相应功能所必需的信息。</p>

      <h2 id="p5" className="scroll-mt-24">5. 保存多久</h2>
      <ul>
        <li>订单和付款记录：按财税要求保存至少 7 年。</li>
        <li>设备上的数据：租期结束后 3 天内整盘抹除。</li>
        <li>联系表单和到货通知：处理完成后保存 1 年，之后删除。</li>
        <li>租赁市场的站内对话：最后一次活动后 {MARKET_LIMITS.messageRetentionDays} 天删除，涉及举报或纠纷的除外。</li>
      </ul>

      <h2 id="p6" className="scroll-mt-24">6. 租赁市场</h2>
      <ul>
        <li>你在市场里公开的内容（昵称、简介、方案、求租、帖子）对所有访问者可见，请不要在其中填写联系方式或敏感信息。</li>
        <li>站内对话只有对话双方可见。处理举报或纠纷时，管理员会查看被举报的消息及其前后少量上下文。</li>
        <li>你可以随时关闭自己发布的方案和求租，也可以申请导出或删除账号数据。</li>
      </ul>

      <h2 id="p7" className="scroll-mt-24">7. 你的权利</h2>
      <p>你可以查询、更正、导出或删除你的个人信息，也可以注销账号。请发邮件到 <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>，或通过 <Link className="text-brand hover:underline" href="/apply">联系我们</Link> 提交，我们会在 15 个工作日内处理。法律要求保留的记录除外。</p>
    </DocPage>
  );
}
