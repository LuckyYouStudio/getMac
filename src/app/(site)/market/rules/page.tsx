import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "市场规则" };

const RULES: [string, string][] = [
  ["如实描述", "方案中的设备型号、内存、硬盘、所在地区、网络类型和账号权限必须与实际一致。信息由房东自述，发现不实将下架处理。"],
  ["平台不经手租金", "GetMac 只提供信息展示和站内沟通，不代收租金、不做担保，交付与售后由租客和房东双方约定。"],
  ["禁止出售或代开第三方账号与网络服务", "不允许出租、代开、代管任何第三方账号（如开发者账号、AI 服务账号），不允许以出租设备为名转售 VPN、代理或网络线路。"],
  ["禁止违法与滥用用途", "设备不得用于挖矿、刷量、群控、发送垃圾信息、侵犯他人权益或任何违法活动。房东和租客都有义务拒绝此类用途。"],
  ["尊重租客隐私", "房东不得录屏、记录按键或查看租客文件；维护前需征得租客同意。租期结束后应整盘抹除租客数据。"],
  ["合理的付款安排", "首次合作建议按月付款，首期一般不超过一个月租金。要求大额预付、或诱导到站外私下交易的，平台将重点核查。"],
  ["站内沟通", "请在站内消息中确认关键条件并保留记录。方案和帖子中不得留站外联系方式或引流信息。"],
  ["保持信息新鲜", "房东应定期确认方案仍可租；长期未确认或已租出的方案应及时下架。"],
  ["举报与处理", "任何人都可以举报可疑方案、求租帖或帖子。平台核实后可下架内容、取消房东认证或停用账号。"],
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="市场规则" desc="适用于租赁市场中的所有房东、租客和帖子。" />
      <Notice tone="info">
        市场中的方案均由第三方房东发布。GetMac 自营机器另按《服务条款》执行，不适用以下关于第三方交易的约定。
      </Notice>
      <ol className="mt-6 space-y-3">
        {RULES.map(([t, d], i) => (
          <li key={t} className="card flex gap-4 p-5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-white">{i + 1}</span>
            <div>
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
