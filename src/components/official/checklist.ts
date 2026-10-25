// 官方房东机器上架清单。heartbeat 一项由系统根据 heartbeatAt 自动判定，房东不能手动勾选。

export const CHECKLIST: { key: string; label: string; hint: string; auto?: boolean }[] = [
  { key: "power", label: "接好 UPS 不间断电源", hint: "短暂停电不掉线，长时间停电能安全关机。" },
  { key: "network", label: "网线直连路由器", hint: "不要用 Wi-Fi，家用光纤上行建议 20M 以上。" },
  { key: "sleep", label: "关闭睡眠", hint: "系统设置 → 能量：防止自动进入睡眠、关闭硬盘休眠。" },
  { key: "autoboot", label: "断电来电后自动开机", hint: "系统设置 → 能量：勾选“断电后自动启动”。" },
  { key: "filevault", label: "关闭 FileVault", hint: "否则断电重启后会停在解锁界面，远程连不上。" },
  { key: "account", label: "为 GetMac 建好管理员账号", hint: "账号名 getmac-ops，密码填在下方交付凭据里。" },
  { key: "script", label: "安装运维脚本", hint: "按下方步骤安装心跳脚本，每 5 分钟上报一次在线状态。" },
  { key: "heartbeat", label: "收到首次心跳", hint: "脚本装好后几分钟内会自动打勾。", auto: true },
];

/** 心跳超过多少分钟算离线 */
export const HEARTBEAT_ONLINE_MINUTES = 10;

export function isOnline(heartbeatAt: Date | null | undefined) {
  return !!heartbeatAt && Date.now() - new Date(heartbeatAt).getTime() < HEARTBEAT_ONLINE_MINUTES * 60000;
}
