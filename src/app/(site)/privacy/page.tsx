import { SITE } from "@/lib/constants";
import { DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "隐私政策" };

const TOC = [
  { id: "p1", label: "我们收集什么" },
  { id: "p2", label: "我们不做什么" },
  { id: "p3", label: "机器运行数据" },
  { id: "p4", label: "数据保留与删除" },
  { id: "p5", label: "你的权利" },
];

export default function PrivacyPage() {
  return (
    <DocPage eyebrow="法律" title="隐私政策" desc="我们尽量少收集数据，收集的也只用于提供服务。" toc={TOC}>
      <h2 id="p1" className="scroll-mt-24">我们收集什么</h2>
      <ul>
        <li>账户信息：邮箱、昵称，以及你主动填写的微信号。</li>
        <li>订单信息：方案、金额、交付邮箱、付款时间。</li>
        <li>站内消息：你和房东之间的咨询记录，用于处理纠纷和举报。</li>
        <li>访问统计：按天汇总的页面浏览量，不关联到个人。</li>
      </ul>

      <h2 id="p2" className="scroll-mt-24">我们不做什么</h2>
      <ul>
        <li>不录屏、不记录按键。</li>
        <li>不为日常运营浏览你机器上的文件。</li>
        <li>不出售、不出租你的个人信息。</li>
        <li>不代开、不代管任何第三方账号。</li>
      </ul>

      <h2 id="p3" className="scroll-mt-24">机器运行数据</h2>
      <p>为了及时发现断电和死机，机器会上报在线状态、CPU 温度、磁盘剩余空间等基础运行指标，不包含任何文件内容或浏览记录。</p>

      <h2 id="p4" className="scroll-mt-24">数据保留与删除</h2>
      <p>租期结束 3 天后，机器整盘抹除并重装系统。账户和订单记录按财务要求保留，依法需要保全的数据另行处理。</p>

      <h2 id="p5" className="scroll-mt-24">你的权利</h2>
      <p>你可以随时在账户设置中修改资料，或发邮件到 {SITE.email} 申请导出或删除你的账户数据。</p>
    </DocPage>
  );
}
