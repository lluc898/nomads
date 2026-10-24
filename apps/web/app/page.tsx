import { featuredTrips, translate } from "@viajeroshub/shared";
import Link from "next/link";

import {
  ArrowRightIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";
import { TripCard } from "@/components/trip-card";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function Home() {
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const quickLinks = [
    t("quickFromBaleares"),
    t("quickSummer"),
    t("quickNoDestination"),
    t("quickLatest"),
  ];
  return (
    <main>
      <SiteHeader />

      <section className="relative isolate z-10 bg-[#eaf3ff] px-5 pt-32 pb-16 md:pt-40 md:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-24 left-[-8rem] size-80 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute top-8 right-[-5rem] size-96 rounded-full bg-orange-200/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[.12em] text-[#0857C9] uppercase">
              <SparklesIcon className="size-4" /> {t("homeEyebrow")}
            </p>
            <h1 className="text-4xl leading-[1.08] font-extrabold tracking-[-.045em] text-balance text-slate-950 md:text-6xl">
              {t("homeTitle")}{" "}
              <span className="text-[#0B6EFD]">{t("homeTitleAccent")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-pretty text-slate-600">
              {t("homeSubtitle")}
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-6xl">
            <SearchForm />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {quickLinks.map((label) => (
              <Link
                key={label}
                href={`/buscar?q=${encodeURIComponent(label)}`}
                className="rounded-full border border-blue-200 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-700 backdrop-blur transition hover:border-[#0B6EFD] hover:text-[#0B6EFD]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[.14em] text-[#0B6EFD] uppercase">
                {t("ideas")}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-slate-950 md:text-4xl">
                {t("forming")}
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                {t("formingSubtitle")}
              </p>
            </div>
            <Link
              href="/buscar"
              className="hidden items-center gap-2 font-bold text-[#0857C9] md:flex"
            >
              {t("viewAll")} <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[.14em] text-[#0B6EFD] uppercase">
              {t("howEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] md:text-4xl">
              {t("howTitle")}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                <SearchIcon key="search" />,
                t("stepFindTitle"),
                t("stepFindDescription"),
              ],
              [
                <UsersIcon key="users" />,
                t("stepConnectTitle"),
                t("stepConnectDescription"),
              ],
              [
                <ShieldIcon key="shield" />,
                t("stepBookTitle"),
                t("stepBookDescription"),
              ],
            ].map(([icon, title, description], index) => (
              <div
                key={String(title)}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#EAF3FF] text-[#0B6EFD]">
                    {icon}
                  </span>
                  <span className="text-3xl font-black text-slate-100">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 overflow-hidden rounded-3xl bg-slate-950 p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <p className="text-sm font-bold tracking-[.14em] text-blue-300 uppercase">
              {t("ctaEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              {t("ctaTitle")}
            </h2>
            <p className="mt-3 text-slate-300">{t("ctaSubtitle")}</p>
          </div>
          <Link
            href="/crear"
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-[#0B6EFD] px-6 font-bold transition hover:bg-blue-500"
          >
            {t("navCreate")} <ArrowRightIcon className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <Logo />
          <p>© 2026 ViajerosHub. {t("footerTagline")}</p>
        </div>
      </footer>
    </main>
  );
}
