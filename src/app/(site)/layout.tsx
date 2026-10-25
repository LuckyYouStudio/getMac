import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { db } from "@/lib/db";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const notice = await db.announcement.findFirst({ where: { published: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="flex min-h-screen flex-col">
      {notice && (
        <div className="bg-safe px-4 py-2 text-center text-xs text-white sm:text-sm">
          <span className="font-semibold">{notice.title}</span>
          <span className="ml-2 opacity-85">{notice.body}</span>
        </div>
      )}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
