import { ShieldIcon } from "@/components/ui";
import { AuthForm } from "../AuthForm";

export const metadata = { title: "登录" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold">登录 GetMac</h1>
        <p className="mt-1 mb-6 flex items-center gap-1.5 text-xs text-safe">
          <ShieldIcon className="h-3.5 w-3.5" /> 密码加盐哈希存储，连接全程加密
        </p>
        <AuthForm mode="login" next={next} />
      </div>
    </div>
  );
}
