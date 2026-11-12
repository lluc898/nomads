"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import {
  HomeIcon,
  MessageCircleIcon,
  PlusCircleIcon,
  SuitcaseIcon,
  UserIcon,
} from "./icons";

type Destination = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: ComponentType<{ className?: string }>;
};

type NavigationLabels = {
  explore: string;
  create: string;
  trips: string;
  messages: string;
  profile: string;
  unread: string;
};

function destinations(labels: NavigationLabels): Destination[] {
  return [
    {
      href: "/buscar",
      label: labels.explore,
      match: (pathname) => pathname === "/buscar",
      icon: HomeIcon,
    },
    {
      href: "/crear",
      label: labels.create,
      match: (pathname) => pathname === "/crear",
      icon: PlusCircleIcon,
    },
    {
      href: "/mis-viajes",
      label: labels.trips,
      match: (pathname) => pathname === "/mis-viajes",
      icon: SuitcaseIcon,
    },
    {
      href: "/mensajes",
      label: labels.messages,
      match: (pathname) =>
        pathname === "/mensajes" || pathname.startsWith("/mensajes/"),
      icon: MessageCircleIcon,
    },
    {
      href: "/perfil",
      label: labels.profile,
      match: (pathname) => pathname === "/perfil",
      icon: UserIcon,
    },
  ];
}

export function MobilePrimaryNavigation({
  labels,
  unreadCount,
}: {
  labels: NavigationLabels;
  unreadCount: number;
}) {
  const pathname = usePathname();
  return (
    <nav
      data-mobile-primary-navigation
      aria-label={labels.explore}
      className="fixed inset-x-4 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl items-center justify-between rounded-[1.6rem] border border-slate-200 bg-white/95 p-1.5 shadow-[0_16px_50px_rgba(15,23,42,.20)] backdrop-blur-xl lg:hidden"
    >
      {destinations(labels).map((destination) => {
        const active = destination.match(pathname);
        const Icon = destination.icon;
        const badge = destination.href === "/mensajes" ? unreadCount : 0;
        return (
          <Link
            key={destination.href}
            href={destination.href}
            aria-current={active ? "page" : undefined}
            aria-label={
              badge
                ? `${destination.label}, ${labels.unread.replace("{count}", String(badge))}`
                : destination.label
            }
            className={`relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6EFD] sm:px-3 ${
              active
                ? "bg-blue-50 text-[#0857C9]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            {active ? (
              <span className="max-w-[4.75rem] truncate">
                {destination.label}
              </span>
            ) : null}
            {badge ? (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] leading-5 font-bold text-white"
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

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
