import Link from "next/link";
import { findTripCards } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";

import { SiteHeader } from "@/components/site-header";
import { TripCard } from "@/components/trip-card";
import { requireCompleteProfilePage } from "@/lib/auth/guards";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getDatabase } from "@/lib/database";

export default async function MyTripsPage() {
  const { user } = await requireCompleteProfilePage("/mis-viajes");
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const trips = await findTripCards(getDatabase(), {
    userId: user.id,
    locale,
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 pt-32 pb-12">
        <p className="text-sm font-bold text-[#0B6EFD]">{t("yourAccount")}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          {t("myTrips")}: {user.name ?? "@viajeroshub"}
        </h1>
        {trips.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} locale={locale} />
            ))}
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}
