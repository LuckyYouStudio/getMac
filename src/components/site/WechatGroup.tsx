import { SITE } from "@/lib/constants";
import { CopyButton } from "./CopyButton";

/**
 * 微信群二维码占位图：按微信号生成确定性的点阵，上线时替换为真实群二维码图片。
 */
export function WechatQr({ size = 148 }: { size?: number }) {
  const n = 25;
  let seed = [...SITE.wechat].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 1;
  const finder = (x: number, y: number) =>
    [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const cells: string[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!finder(x, y) && rnd()) cells.push(`M${x} ${y}h1v1h-1z`);
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="currentColor" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="white" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} className="rounded-lg bg-white text-navy" role="img" aria-label="微信群二维码（示意）">
      <path d={cells.join("")} fill="currentColor" />
      {eye(0, 0)}{eye(n - 7, 0)}{eye(0, n - 7)}
    </svg>
  );
}

/** 交流群板块：二维码 + 有效期 + 复制微信号 */
export function WechatGroup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col gap-5 sm:flex-row sm:items-center ${compact ? "" : "card p-6"}`}>
      <div className="shrink-0 self-start rounded-xl border border-line bg-white p-2"><WechatQr /></div>
      <div className="min-w-0">
        <div className="font-semibold text-ink">找设备，也来群里聊聊。</div>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          交流可租设备、求租需求和远程 Mac 使用经验，房东、租客都欢迎。用微信或企业微信扫码加入；手机上可以先保存图片，再在“扫一扫”里从相册选取。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton text={SITE.wechat} label={`复制微信号 ${SITE.wechat}`} />
          <span className="text-xs text-muted">扫码不成功？加微信回复“进群”。</span>
        </div>
        <p className="mt-2 text-xs text-muted">
          本码有效期至 {SITE.wechatGroupExpires}，过期后加微信进群。入群自愿；第三方设备的租金、交付与售后由双方自行约定。
        </p>
      </div>
    </div>
  );
}
