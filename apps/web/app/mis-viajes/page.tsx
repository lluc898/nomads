import Link from "next/link";
import { translate } from "@viajeroshub/shared";

import { LanguageSelector } from "@/components/language-selector";
import { Logo } from "@/components/logo";
import { requireCompleteProfilePage } from "@/lib/auth/guards";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function MyTripsPage() {
  const { user } = await requireCompleteProfilePage("/mis-viajes");
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              href="/crear"
              className="rounded-xl bg-[#0B6EFD] px-4 py-3 text-sm font-bold text-white"
            >
              {t("navCreate")}
            </Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-bold text-[#0B6EFD]">{t("yourAccount")}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          {t("myTrips")}: {user.name ?? "@viajeroshub"}
        </h1>
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-xl font-bold text-slate-900">{t("myTrips")}</h2>
          <p className="mx-auto mt-2 max-w-md leading-6 text-slate-600">
            {t("myTripsDescription")}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/crear"
              className="rounded-xl bg-[#0B6EFD] px-5 py-3 font-bold text-white"
            >
              {t("createTrip")}
            </Link>
            <Link
              href="/buscar"
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              {t("navExplore")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
