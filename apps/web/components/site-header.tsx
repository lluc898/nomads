import { countUnreadNotifications } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import Link from "next/link";

import { auth, signOut } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { LanguageSelector } from "./language-selector";
import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { UserAvatar } from "./user-avatar";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

function MessagesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M5 5.5h14v10H9l-4 3v-13Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <path
        d="m6.5 8 3.5 3.5L13.5 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export async function SiteHeader() {
  const [session, locale] = await Promise.all([auth(), getRequestLocale()]);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const unreadCount = session?.user?.id
    ? await countUnreadNotifications(getDatabase(), session.user.id)
    : 0;
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-16 max-w-7xl items-center rounded-2xl border border-slate-200/90 bg-white/95 px-3 shadow-[0_10px_35px_rgba(15,23,42,.10)] backdrop-blur-xl sm:px-4 lg:px-5">
        <Logo />

        <nav
          className="ml-10 hidden items-center gap-1 text-sm font-semibold text-slate-600 lg:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/buscar"
            className="rounded-lg px-3 py-2.5 transition hover:bg-slate-100 hover:text-slate-950"
          >
            {t("navExplore")}
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/mis-viajes"
                className="rounded-lg px-3 py-2.5 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {t("navMyTrips")}
              </Link>
              <Link
                href="/mensajes"
                className="rounded-lg px-3 py-2.5 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {t("messages")}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="ml-auto hidden items-center gap-1.5 lg:flex">
          <LanguageSelector compact />
          {session?.user ? (
            <NotificationBell
              initialUnreadCount={unreadCount}
              label={t("notifications")}
            />
          ) : null}
          <Link
            href="/crear"
            className="ml-1 inline-flex min-h-11 items-center rounded-xl bg-[#0B6EFD] px-4 text-sm font-bold text-white shadow-[0_6px_18px_rgba(11,110,253,.20)] transition hover:bg-[#0857C9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6EFD]"
          >
            {t("navCreate")}
          </Link>
          {session?.user ? (
            <details className="group relative ml-1">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white pr-2.5 pl-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <UserAvatar
                  image={session.user.image ?? null}
                  name={session.user.name ?? null}
                  size="xs"
                />
                <span className="max-w-28 truncate">
                  {session.user.name ?? t("navAccount")}
                </span>
                <span className="transition group-open:rotate-180">
                  <ChevronIcon />
                </span>
              </summary>
              <div className="absolute top-[calc(100%+.6rem)] right-0 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,.16)]">
                <Link
                  href="/perfil"
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  {t("navProfile")}
                </Link>
                <form action={signOutAction} className="border-t border-slate-100 pt-1">
                  <button
                    type="submit"
                    className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                  >
                    {t("navSignOut")}
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link
              href="/acceso"
              className="ml-1 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              {t("navSignIn")}
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {session?.user ? (
            <NotificationBell
              initialUnreadCount={unreadCount}
              label={t("notifications")}
            />
          ) : null}
          <details className="group relative">
            <summary
              aria-label={t("navAccount")}
              className="grid size-11 cursor-pointer list-none place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
            >
              <MenuIcon />
            </summary>
            <div className="absolute top-[calc(100%+.7rem)] right-0 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_55px_rgba(15,23,42,.18)]">
              {session?.user ? (
                <div className="mb-2 flex items-center gap-3 border-b border-slate-100 px-2 pb-3">
                  <UserAvatar
                    image={session.user.image ?? null}
                    name={session.user.name ?? null}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-950">
                      {session.user.name ?? t("navAccount")}
                    </p>
                  </div>
                </div>
              ) : null}
              <nav className="grid" aria-label="Mobile navigation">
                <Link
                  href="/buscar"
                  className="min-h-11 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  {t("navExplore")}
                </Link>
                {session?.user ? (
                  <>
                    <Link
                      href="/mis-viajes"
                      className="min-h-11 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      {t("navMyTrips")}
                    </Link>
                    <Link
                      href="/mensajes"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <MessagesIcon /> {t("messages")}
                    </Link>
                    <Link
                      href="/perfil"
                      className="min-h-11 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      {t("navProfile")}
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/acceso"
                    className="min-h-11 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    {t("navSignIn")}
                  </Link>
                )}
              </nav>
              <Link
                href="/crear"
                className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-[#0B6EFD] px-4 text-sm font-bold text-white"
              >
                {t("navCreate")}
              </Link>
              <div className="mt-3 border-t border-slate-100 px-2 pt-3">
                <LanguageSelector />
              </div>
              {session?.user ? (
                <form action={signOutAction} className="mt-3 border-t border-slate-100 pt-2">
                  <button
                    type="submit"
                    className="min-h-11 w-full cursor-pointer rounded-xl px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    {t("navSignOut")}
                  </button>
                </form>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
