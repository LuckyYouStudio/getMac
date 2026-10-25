import { ShieldIcon } from "@/components/ui";
import { AuthForm } from "../AuthForm";

export const metadata = { title: "注册" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold">注册账号</h1>
        <p className="mt-1 mb-6 flex items-center gap-1.5 text-xs text-safe">
          <ShieldIcon className="h-3.5 w-3.5" /> 我们只用邮箱发送订单和交付通知
        </p>
        <AuthForm mode="register" next={next} />
      </div>
    </div>
  );
}
