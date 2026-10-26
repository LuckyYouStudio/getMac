import type { Machine, Plan, User } from "@prisma/client";
import { COUNTRIES, MACHINE_STATUS } from "@/lib/constants";

/** 设备表单字段（新增与编辑共用，外层 form 由页面提供） */
export function MachineForm({
  m, plans, hosts, suggestions = [],
}: {
  m?: Machine;
  plans: Plan[];
  hosts: User[];
  suggestions?: string[];
}) {
  return (
    <>
      <input type="hidden" name="id" value={m?.id ?? ""} />
      <label className="block">
        <span className="label">名称（城市名）</span>
        <input name="name" list="city-names" className="input" required defaultValue={m?.name} />
        <datalist id="city-names">{suggestions.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label className="block"><span className="label">展示位置</span><input name="location" className="input" required defaultValue={m?.location ?? "温哥华 · 市中心"} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">国家/地区</span>
          <select name="country" className="input" defaultValue={m?.country ?? "US"}>
            {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">城市</span><input name="city" className="input" defaultValue={m?.city ?? ""} /></label>
      </div>
      <label className="block"><span className="label">芯片</span><input name="chip" className="input" required defaultValue={m?.chip ?? "Apple M4"} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">内存 GB</span><input name="memory" type="number" className="input" required defaultValue={m?.memory ?? 16} /></label>
        <label className="block"><span className="label">硬盘 GB</span><input name="storage" type="number" className="input" required defaultValue={m?.storage ?? 256} /></label>
      </div>
      <label className="block">
        <span className="label">所属方案</span>
        <select name="planId" className="input" defaultValue={m?.planId ?? plans[0]?.id}>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">归属</span>
        <select name="ownerId" className="input" defaultValue={m?.ownerId ?? ""}>
          <option value="">自营</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>官方房东 · {h.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">状态</span>
        <select name="status" className="input" defaultValue={m?.status ?? "AVAILABLE"}>
          {Object.entries(MACHINE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">交付凭据（仅后台可见）</span>
        <textarea name="deliveryCredential" rows={2} className="input font-mono text-xs" defaultValue={m?.deliveryCredential ?? ""} />
      </label>
      <label className="block"><span className="label">备注</span><textarea name="notes" rows={2} className="input" defaultValue={m?.notes ?? ""} /></label>
    </>
  );
}
