import { CHIPS, MEMORY_OPTIONS, STORAGE_OPTIONS } from "@/lib/constants";
import { Field } from "@/components/ui";

type Defaults = { location?: string; city?: string | null; chip?: string; memory?: number; storage?: number; planId?: string };
type PlanOpt = { id: string; name: string; spec: string };

/** 登记 / 编辑机器共用的配置字段 */
export function MachineSpecFields({ plans, d = {}, disabled = false }: { plans: PlanOpt[]; d?: Defaults; disabled?: boolean }) {
  const chip = d.chip?.replace(/^Apple\s+/, "");
  return (
    <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
      <Field label="所在地（展示给租客）" hint="写到区一级即可，例如“本拿比 · 铁道镇”，不要写街道门牌。">
        <input name="location" className="input" required defaultValue={d.location} placeholder="本拿比 · 铁道镇" />
      </Field>
      <Field label="城市">
        <input name="city" className="input" required defaultValue={d.city ?? ""} placeholder="本拿比" />
      </Field>
      <Field label="芯片">
        <select name="chip" className="input" required defaultValue={chip ?? ""}>
          <option value="" disabled>请选择</option>
          {CHIPS.map((c) => <option key={c} value={c}>Apple {c}</option>)}
        </select>
      </Field>
      <Field label="内存（GB）">
        <select name="memory" className="input" required defaultValue={d.memory ?? 16}>
          {MEMORY_OPTIONS.map((m) => <option key={m} value={m}>{m} GB</option>)}
        </select>
      </Field>
      <Field label="存储">
        <select name="storage" className="input" required defaultValue={d.storage ?? 256}>
          {STORAGE_OPTIONS.map((s) => <option key={s} value={s}>{s >= 1024 ? `${s / 1024} TB` : `${s} GB`}</option>)}
        </select>
      </Field>
      <Field label="希望归入的档位" hint="验收时我们会按实际配置确认档位。">
        <select name="planId" className="input" required defaultValue={d.planId ?? ""}>
          <option value="" disabled>请选择</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}档 · {p.spec}</option>)}
        </select>
      </Field>
    </fieldset>
  );
}
