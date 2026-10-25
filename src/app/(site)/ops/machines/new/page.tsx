import Link from "next/link";
import { db } from "@/lib/db";
import { CITY_NAMES } from "@/lib/constants";
import { Field, FormError, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { MachineSpecFields } from "@/components/official/MachineSpecFields";
import { registerMachineAction } from "../../actions";

export const metadata = { title: "登记机器" };

const EXTRA_NAMES = ["Atlanta", "Dallas", "Houston", "Orlando", "Raleigh", "Sacramento", "Savannah", "Tucson", "Madison", "Boulder"];

export default async function NewMachinePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [plans, taken] = await Promise.all([
    db.plan.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    db.machine.findMany({ select: { name: true } }),
  ]);
  const used = new Set(taken.map((t) => t.name));
  const free = [...CITY_NAMES, ...EXTRA_NAMES].filter((n) => !used.has(n));

  return (
    <div className="max-w-2xl">
      <Link href="/ops" className="text-sm text-muted hover:text-brand">← 回到概览</Link>
      <PageHeader title="登记机器" desc="登记后进入“待上架”，完成清单并通过我们的远程验收才会出租。" />
      <form action={registerMachineAction} className="card space-y-5 p-6">
        <Field label="给机器起个名字" hint="用一个美国城市名，英文字母。租客会在下单时看到它。">
          <input name="name" className="input" required list="free-names" defaultValue={free[0] ?? ""} pattern="[A-Za-z][A-Za-z ]{1,19}" />
          <datalist id="free-names">
            {free.map((n) => <option key={n} value={n} />)}
          </datalist>
        </Field>
        {free.length > 0 && (
          <p className="-mt-3 text-xs text-muted">可用的名字：{free.slice(0, 8).join("、")}</p>
        )}
        <MachineSpecFields plans={plans} />
        <FormError message={error} />
        <div className="flex items-center gap-3">
          <SubmitButton>登记并查看上架清单</SubmitButton>
          <span className="text-xs text-muted">登记后会生成运维令牌，用于安装心跳脚本。</span>
        </div>
      </form>
    </div>
  );
}
