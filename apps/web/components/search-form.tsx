"use client";

import { LocationCombobox } from "./location-combobox";
import { TravelDatePicker } from "./travel-date-picker";
import { SearchIcon } from "./icons";
import { useI18n } from "./i18n-provider";

export function SearchForm() {
  const { t } = useI18n();
  return (
    <form
      action="/buscar"
      className="rounded-2xl border border-white/60 bg-white shadow-[0_18px_50px_rgba(15,23,42,.18)] md:flex md:items-stretch"
    >
      <LocationCombobox
        label={t("from")}
        name="origen"
        placeholder={t("countryAirport")}
      />
      <LocationCombobox
        label={t("to")}
        name="destino"
        placeholder={t("anywhere")}
        includeAnywhere
      />
      <TravelDatePicker />
      <div className="p-2.5 md:flex md:items-stretch">
        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6EFD] px-5 font-bold text-white transition hover:bg-[#0857C9] md:w-auto"
          type="submit"
        >
          <SearchIcon className="size-[18px]" />
          <span className="md:hidden lg:inline">{t("searchTrips")}</span>
        </button>
      </div>
    </form>
  );
}
