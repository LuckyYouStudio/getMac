import Link from "next/link";
import { SITE } from "@/lib/constants";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-white">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="7" width="16" height="10" rx="2.5" />
          <path d="M8 17v1.5M16 17v1.5" strokeLinecap="round" />
          <circle cx="16.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={`text-lg font-semibold tracking-tight ${light ? "text-white" : "text-navy"}`}>{SITE.name}</span>
    </Link>
  );
}
