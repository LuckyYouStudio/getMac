import Link from "next/link";
import { OFFICIAL_HOST_FEE, SITE } from "@/lib/constants";

export const metadata = { title: "官方房东协议" };

const SECTIONS: { id: string; title: string; body: string[] }[] = [
  {
    id: "a1",
    title: "适用范围",
    body: [
      `本协议适用于把自有 Mac 设备交由 ${SITE.name} 统一出租的“官方房东”。在租赁市场自行发布方案的房东不适用本协议，适用市场规则。`,
      "勾选同意并开通房东后台，即视为你已阅读并接受本协议的全部条款。",
    ],
  },
  {
    id: "a2",
    title: "设备与所有权",
    body: [
      "设备的所有权始终归你。我们只在租期内取得为租客提供服务所需的远程管理权限。",
      "你保证设备来源合法、可以自由处置，且没有被锁定在他人的 Apple ID 或设备管理（MDM）下。",
    ],
  },
  {
    id: "a3",
    title: "费用与结算",
    body: [
      `设备租出的每个自然月，我们按每台 ${OFFICIAL_HOST_FEE} 美元收取平台服务费，客户实付减去服务费的部分归你。未租出的月份不收取任何费用。`,
      "客户退款、因你方原因造成的减免会从对应月份的应付金额中扣除。",
      "每月 1 日生成上月结算单，次月 10 日前打款到你在房东后台填写的收款账户。跨境手续费和税费由你自行承担。",
    ],
  },
  {
    id: "a4",
    title: "在线要求",
    body: [
      "你需要让设备 24 小时通电并接入有线网络，月度在线率目标为 99%。",
      "计划内的停电或断网（搬家、换宽带等）请至少提前 3 天在房东后台或邮件告知我们，以便通知租客。",
      "连续离线超过 24 小时且无法联系到你时，我们有权为租客更换设备，当月对应天数不计入你的分成。",
    ],
  },
  {
    id: "a5",
    title: "现场响应",
    body: [
      "设备卡死、断网或需要物理操作时，我们会通过邮件和你预留的联系方式发出请求。你应在 4 小时内响应、24 小时内处理完毕。",
      "现场操作只限于重启、插拔网线电源、按我们的指引检查硬件。",
    ],
  },
  {
    id: "a6",
    title: "数据与隐私边界",
    body: [
      "出租期间，你不得登录租客的账号、查看或复制租客的文件、截屏录屏、抓包或以任何方式监视设备上的活动。",
      "需要进入租客环境的维护，一律由我们在征得租客同意后进行，并保留操作记录。",
      "每次租期结束后，由我们整盘抹除并重装系统，之后你才可以收回使用。",
    ],
  },
  {
    id: "a7",
    title: "退出与终止",
    body: [
      "你可以随时申请退出，需提前 30 天通知。我们会在现有租期结束或为租客迁移完成后，抹盘并把设备交还给你。",
      "如你违反数据与隐私边界条款，我们可以立即终止合作，并暂停尚未结算的款项用于赔付租客。",
    ],
  },
  {
    id: "a8",
    title: "责任限制",
    body: [
      "设备的自然损坏、老化由你承担；租客使用中的损坏，我们协助向租客追偿。",
      "因不可抗力（停电、自然灾害、网络运营商故障等）导致的服务中断，双方均不承担违约责任。",
      "我们对你的赔偿责任以最近三个月实际支付给你的分成总额为上限。",
    ],
  },
  {
    id: "a9",
    title: "协议变更",
    body: ["我们修改本协议时会提前 30 天在房东后台和邮件通知。你不同意的，可以按第 7 条退出，退出前继续适用旧版本。"],
  },
];

export default function HostAgreementPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <p className="eyebrow">官方房东</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">官方房东协议</h1>
      <p className="mt-2 text-sm text-muted">最近更新：2026 年 10 月 25 日</p>

      <nav className="card mt-8 p-5 text-sm">
        <div className="mb-2 font-medium text-ink">目录</div>
        <ol className="grid gap-1 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id}><a href={`#${s.id}`} className="text-brand hover:underline">{i + 1}. {s.title}</a></li>
          ))}
        </ol>
      </nav>

      <div className="prose-gm mt-8">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2>{i + 1}. {s.title}</h2>
            {s.body.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/join#signup" className="btn-primary">回到开通页</Link>
        <a href={`mailto:${SITE.email}`} className="btn-outline">对协议有疑问</a>
      </div>
    </div>
  );
}
