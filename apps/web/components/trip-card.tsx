import {
  translate,
  type SupportedLocale,
  type TripCard as TripCardData,
} from "@viajeroshub/shared";
import Link from "next/link";

import { ArrowRightIcon, CalendarIcon, MapPinIcon, UsersIcon } from "./icons";

const toneClasses = {
  sea: "from-[#0b6efd] via-[#24a5c7] to-[#9fe1d1]",
  sunset: "from-[#3446a8] via-[#da5f6a] to-[#ffc06b]",
  forest: "from-[#173c46] via-[#29705b] to-[#b7c98b]",
};

export function TripCard({
  trip,
  locale = "es",
}: {
  trip: TripCardData;
  locale?: SupportedLocale;
}) {
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(15,23,42,.12)]">
      <div
        className={`relative h-40 overflow-hidden bg-gradient-to-br ${toneClasses[trip.tone]}`}
      >
        <div className="absolute -top-12 -right-7 size-40 rounded-full border border-white/25" />
        <div className="absolute -top-7 -right-2 size-28 rounded-full border border-white/25" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-5 right-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 backdrop-blur">
          {trip.visibility === "public" ? t("public") : t("private")}
        </div>
        <div className="absolute bottom-4 left-5 flex items-center gap-2 text-white">
          <MapPinIcon className="size-5" />
          <span className="text-xl font-bold tracking-tight">
            {trip.destination}
          </span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm font-semibold text-[#0B6EFD]">
          {t("from")} {trip.origin}
        </p>
        <h3 className="mt-1 text-xl font-bold tracking-[-.025em] text-slate-950">
          Viaje a {trip.destination}
        </h3>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-slate-400" />
            {trip.dateLabel}
          </p>
          <p className="flex items-center gap-2">
            <UsersIcon className="size-4 text-slate-400" />
            {trip.availablePlaces ?? t("unlimited")} {t("availablePlaces")}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {trip.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-xs text-slate-500">{t("guidePrice")}</span>
            <p className="text-lg font-extrabold text-slate-950">
              {trip.priceFrom
                ? t("priceFrom", { price: trip.priceFrom })
                : t("undefinedPrice")}
            </p>
          </div>
          <Link
            href={`/viajes/${trip.slug}`}
            className="flex min-h-11 items-center gap-1 rounded-xl bg-[#EAF3FF] px-4 text-sm font-bold text-[#0857C9] transition group-hover:bg-[#0B6EFD] group-hover:text-white"
          >
            {t("viewTrip")} <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span className="grid size-7 place-items-center rounded-full bg-slate-900 font-bold text-white">
            {trip.creator.initials}
          </span>
          Creado por {trip.creator.name} · {trip.publishedLabel}
        </div>
      </div>
    </article>
  );
}
