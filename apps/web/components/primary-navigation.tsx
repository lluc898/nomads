"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PathAwareLink({
  href,
  match,
  className,
  activeClassName,
  children,
}: {
  href: string;
  match?: "exact" | "prefix";
  className: string;
  activeClassName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    match === "prefix"
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : ""}`}
    >
      {children}
    </Link>
  );
}

export function PathAwareAccountDetails({
  summary,
  children,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === "/perfil";
  return (
    <details className="group relative ml-1">
      <summary
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border pr-2.5 pl-1.5 text-sm font-bold transition [&::-webkit-details-marker]:hidden ${
          active
            ? "border-blue-200 bg-blue-50 text-[#0857C9]"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {summary}
      </summary>
      {children}
    </details>
  );
}
