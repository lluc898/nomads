import Link from "next/link";
import { findTripCardPage } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";

import { SearchForm } from "@/components/search-form";
import { SearchTripGrid } from "@/components/search-trip-grid";
import { SiteHeader } from "@/components/site-header";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type SearchPageProps = {
  searchParams: Promise<{
    origen?: string;
    origenLabel?: string;
    destino?: string;
    destinoLabel?: string;
    departureDate?: string;
    returnDate?: string;
    flexibleMonth?: string;
    cursor?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale();
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  const hasSearch = Boolean(
    params.origen ||
    params.destino ||
    params.departureDate ||
    params.flexibleMonth,
  );
  const page = await findTripCardPage(getDatabase(), {
    origin: params.origen,
    destination: params.destino,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    flexibleMonth: params.flexibleMonth,
    locale,
    cursor: params.cursor,
    limit: 12,
    includeTotal: hasSearch,
  });
  const trips = page.items;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="bg-[#EAF3FF] px-5 pt-28 pb-8 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-widest text-[#0857C9] uppercase">
                {t("searchResults")}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                {hasSearch ? t("yourTripOptions") : t("searchTrips")}
              </h1>
            </div>
            {hasSearch ? (
              <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0857C9] shadow-sm">
                {t("resultsFound", { count: page.total ?? 0 })}
              </p>
            ) : null}
          </div>
          <div className="mt-6">
            <SearchForm
              values={{
                origin: params.origen,
                originLabel: params.origenLabel,
                destination: params.destino,
                destinationLabel: params.destinoLabel,
                departureDate: params.departureDate,
                returnDate: params.returnDate,
                flexibleMonth: params.flexibleMonth,
              }}
            />
          </div>
        </div>
      </section>
      <section className="px-5 py-10 md:py-12">
        {trips.length ? (
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">
                  {t("availableTrips")}
                </h2>
              </div>
            </div>
            <SearchTripGrid
              initialPage={page}
              locale={locale}
              query={{
                origin: params.origen,
                destination: params.destino,
                departureDate: params.departureDate,
                returnDate: params.returnDate,
                flexibleMonth: params.flexibleMonth,
              }}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
              ⌕
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
              {hasSearch ? t("noTripsRoute") : t("countryAirport")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl leading-6 text-slate-600">
              {hasSearch ? t("noTripsHelp") : t("typeLocation")}
            </p>
            {hasSearch ? (
              <Link
                href="/crear"
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#0B6EFD] px-6 font-bold text-white hover:bg-[#0857C9]"
              >
                {t("createTrip")}
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
