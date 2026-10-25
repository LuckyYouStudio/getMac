import { SITE } from "@/lib/constants";
import { DocPage } from "@/components/selfserve/DocPage";

export const metadata = { title: "服务条款" };

const TOC = [
  { id: "t1", label: "1. 服务内容" },
  { id: "t2", label: "2. 账号与安全" },
  { id: "t3", label: "3. 使用规范" },
  { id: "t4", label: "4. 费用与续费" },
  { id: "t5", label: "5. 退款" },
  { id: "t6", label: "6. 维护与故障" },
  { id: "t7", label: "7. 租赁市场" },
  { id: "t8", label: "8. 其他" },
];

export default function TermsPage() {
  return (
    <DocPage eyebrow="法律" title="服务条款" desc="最近更新：2026 年 10 月。使用本站即表示你同意以下条款。" toc={TOC}>
      <h2 id="t1" className="scroll-mt-24">1. 服务内容</h2>
      <p>{SITE.name} 向你出租位于美国的 Mac 实体机（“自营方案”），在租期内由你的团队独享使用，并提供远程连接信息、硬件照看与基础运维。</p>

      <h2 id="t2" className="scroll-mt-24">2. 账号与安全</h2>
      <ul>
        <li>你需对自己的账号及机器上的管理员密码妥善保管。</li>
        <li>交付后请及时修改初始密码。因你泄露连接信息造成的损失由你承担。</li>
        <li>我们保留一个维护账号，仅在你同意后用于维护，并记录必要的操作日志。</li>
      </ul>

      <h2 id="t3" className="scroll-mt-24">3. 使用规范</h2>
      <p>不得将机器用于挖矿、刷量、发送垃圾信息、攻击他人系统、侵犯知识产权或任何违反中美两地法律的用途。违反者我们有权立即停机且不予退款。</p>

      <h2 id="t4" className="scroll-mt-24">4. 费用与续费</h2>
      <ul>
        <li>费用以美元计价，按所选周期（月 / 季 / 年）预付，不收押金。</li>
        <li>到期前 7 天邮件提醒；未续费则到期自动停用，不自动扣款。</li>
        <li>停用后数据保留 3 天，之后整盘抹除。</li>
      </ul>

      <h2 id="t5" className="scroll-mt-24">5. 退款</h2>
      <ul>
        <li>付款后、交付连接信息之前，可申请全额退款。</li>
        <li>交付后 48 小时内，如因机器硬件或网络原因无法正常使用，且我们未能修复，可全额退款。</li>
        <li>其他情况下，按剩余未使用的完整月份比例退款；季付、年付按折后月均价计算。</li>
        <li>因违反使用规范被停机的，不予退款。</li>
      </ul>

      <h2 id="t6" className="scroll-mt-24">6. 维护与故障</h2>
      <p>我们会尽力保持机器 24 小时在线。遇到断电、死机、硬件故障，我们会在当地处理或换机；单次故障超过 24 小时的，按停机时长顺延租期。</p>

      <h2 id="t7" className="scroll-mt-24">7. 租赁市场</h2>
      <p>租赁市场的方案由第三方房东发布。平台提供信息展示、站内咨询和举报处理，但不核验设备、不经手租金，也不对第三方设备的交付和售后负责。双方的交易由双方自行约定。</p>

      <h2 id="t8" className="scroll-mt-24">8. 其他</h2>
      <p>我们可能会更新本条款，重大变更会提前邮件通知。如有疑问，请联系 {SITE.email}。</p>
    </DocPage>
  );
}
