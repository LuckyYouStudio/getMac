import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Field, Notice, PageHeader, ShieldIcon } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { savePayoutInfoAction } from "../actions";

export const metadata = { title: "收款信息" };

export default async function OpsPayoutPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ saved }, user] = await Promise.all([searchParams, requireUser("/ops/payout")]);
  return (
    <div className="max-w-2xl">
      <Link href="/ops" className="text-sm text-muted hover:text-brand">← 回到概览</Link>
      <PageHeader title="收款信息" desc="每月 10 日前把上月分成打到这里。" />
      {saved && <div className="mb-4"><Notice tone="ok">已保存。</Notice></div>}
      <form action={savePayoutInfoAction} className="card space-y-4 p-6">
        <Field label="收款方式与账户" hint="例如：PayPal 邮箱；或 Wise / 美国银行账户的户名、账号、Routing Number。">
          <textarea name="payoutInfo" className="input min-h-32 font-mono" defaultValue={user.payoutInfo ?? ""} maxLength={500} />
        </Field>
        <p className="flex items-center gap-1.5 text-xs text-safe">
          <ShieldIcon className="h-3.5 w-3.5" />只有你本人和 GetMac 财务能看到这些信息
        </p>
        <SubmitButton>保存</SubmitButton>
      </form>
    </div>
  );
}
