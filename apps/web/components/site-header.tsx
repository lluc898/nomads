import { countUnreadNotifications } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import Link from "next/link";

import { auth, signOut } from "@/auth";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getDatabase } from "@/lib/database";

import { LanguageSelector } from "./language-selector";
import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";

export async function SiteHeader() {
  const [session, locale] = await Promise.all([auth(), getRequestLocale()]);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const unreadCount = session?.user?.id
    ? await countUnreadNotifications(getDatabase(), session.user.id)
    : 0;

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <nav
            className="hidden items-center gap-5 text-sm font-semibold text-slate-700 md:flex"
            aria-label="Main navigation"
          >
            <LanguageSelector compact />
            <Link href="/buscar" className="transition hover:text-[#0B6EFD]">
              {t("navExplore")}
            </Link>
            <Link
              href="/#como-funciona"
              className="transition hover:text-[#0B6EFD]"
            >
              {t("navHow")}
            </Link>
            {session?.user ? (
              <>
                <Link
                  href="/mis-viajes"
                  className="transition hover:text-[#0B6EFD]"
                >
                  {t("navMyTrips")}
                </Link>
                <Link
                  href="/mensajes"
                  className="transition hover:text-[#0B6EFD]"
                >
                  {t("messages")}
                </Link>
                <Link
                  href="/perfil"
                  className="transition hover:text-[#0B6EFD]"
                >
                  {t("navProfile")}
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="cursor-pointer transition hover:text-[#0B6EFD]"
                  >
                    {t("navSignOut")}
                  </button>
                </form>
              </>
            ) : (
              <Link href="/acceso" className="transition hover:text-[#0B6EFD]">
                {t("navSignIn")}
              </Link>
            )}
            <Link
              href="/crear"
              className="rounded-xl bg-[#0B6EFD] px-4 py-3 text-white shadow-[0_6px_18px_rgba(11,110,253,.2)] transition hover:bg-[#0857C9]"
            >
              {t("navCreate")}
            </Link>
          </nav>
          {session?.user ? (
            <>
              <Link
                href="/mensajes"
                aria-label={t("messages")}
                className="grid size-11 place-items-center rounded-xl text-slate-700 transition hover:bg-white/70 hover:text-[#0B6EFD] md:hidden"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 5.5h14v10H9l-4 3v-13Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <NotificationBell
                initialUnreadCount={unreadCount}
                label={t("notifications")}
              />
            </>
          ) : null}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector compact />
            <Link
              href={session?.user ? "/perfil" : "/acceso"}
              className="rounded-xl bg-[#0B6EFD] px-3 py-2.5 text-sm font-bold text-white"
            >
              {session?.user ? t("navAccount") : t("navSignIn")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
