"use client";

import type { TripLinkInput } from "@viajeroshub/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { LocationCombobox } from "@/components/location-combobox";
import { TravelDatePicker } from "@/components/travel-date-picker";

type EditableLink = TripLinkInput & { key: string };

export function CreateTripForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [links, setLinks] = useState<EditableLink[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const budget = String(data.get("budget") ?? "").replace(",", ".");
    const maxParticipants = String(data.get("maxParticipants") ?? "");
    const payload = {
      origin: data.get("origin"),
      destination: data.get("destination"),
      departureDate: data.get("departureDate"),
      returnDate: data.get("returnDate"),
      description: data.get("description"),
      visibility: data.get("visibility"),
      budget: budget ? Number(budget) : null,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      links: links.map((link) => ({
        name: link.name,
        type: link.type,
        url: link.url,
      })),
    };
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Error");
      router.push("/mis-viajes?created=1");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
      setPending(false);
    }
  }

  function updateLink(key: string, patch: Partial<TripLinkInput>) {
    setLinks((current) =>
      current.map((link) => (link.key === key ? { ...link, ...patch } : link)),
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <legend className="px-2 text-lg font-extrabold text-slate-950">
          {t("routeAndDates")}
        </legend>
        <div className="overflow-visible rounded-2xl border border-slate-200 md:flex">
          <LocationCombobox
            label={t("from")}
            name="origin"
            placeholder={t("countryAirport")}
          />
          <LocationCombobox
            label={t("to")}
            name="destination"
            placeholder={t("countryAirport")}
          />
          <TravelDatePicker exactOnly />
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <legend className="px-2 text-lg font-extrabold text-slate-950">
          {t("tripDetails")}
        </legend>
        <label className="block font-bold text-slate-800">
          {t("description")}
          <textarea
            name="description"
            maxLength={3000}
            rows={5}
            placeholder={t("descriptionPlaceholder")}
            className="mt-2 block w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-[#0B6EFD] focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="font-bold text-slate-800">
            {t("budgetOptional")}
            <div className="mt-2 flex rounded-xl border border-slate-300 focus-within:border-[#0B6EFD] focus-within:ring-4 focus-within:ring-blue-100">
              <input
                name="budget"
                inputMode="decimal"
                className="min-h-12 min-w-0 flex-1 rounded-xl px-4 font-normal outline-none"
              />
              <span className="grid place-items-center px-4 text-slate-500">
                EUR
              </span>
            </div>
          </label>
          <label className="font-bold text-slate-800">
            {t("groupSizeOptional")}
            <input
              name="maxParticipants"
              type="number"
              min={2}
              max={50}
              className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-[#0B6EFD] focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
        <label className="mt-5 block font-bold text-slate-800">
          {t("privacy")}
          <select
            name="visibility"
            className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-normal outline-none focus:border-[#0B6EFD]"
          >
            <option value="public">{t("public")}</option>
            <option value="private">{t("private")}</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <legend className="px-2 text-lg font-extrabold text-slate-950">
          {t("bookingLinks")}
        </legend>
        <p className="text-sm leading-6 text-slate-600">
          {t("bookingLinksHelp")}
        </p>
        <div className="mt-4 space-y-4">
          {links.map((link) => (
            <div
              key={link.key}
              className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_11rem]"
            >
              <input
                required
                value={link.name}
                onChange={(event) =>
                  updateLink(link.key, { name: event.target.value })
                }
                placeholder={t("linkName")}
                className="min-h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-[#0B6EFD]"
              />
              <select
                value={link.type}
                onChange={(event) =>
                  updateLink(link.key, {
                    type: event.target.value as TripLinkInput["type"],
                  })
                }
                className="min-h-12 rounded-xl border border-slate-300 bg-white px-4"
              >
                <option value="flight">{t("flight")}</option>
                <option value="accommodation">{t("accommodation")}</option>
              </select>
              <input
                required
                type="url"
                value={link.url}
                onChange={(event) =>
                  updateLink(link.key, { url: event.target.value })
                }
                placeholder={t("linkUrl")}
                pattern="https://.*"
                className="min-h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-[#0B6EFD] sm:col-span-2"
              />
              <button
                type="button"
                onClick={() =>
                  setLinks((current) =>
                    current.filter((item) => item.key !== link.key),
                  )
                }
                className="min-h-11 justify-self-start font-bold text-red-600"
              >
                {t("remove")}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={links.length >= 20}
          onClick={() =>
            setLinks((current) => [
              ...current,
              { key: crypto.randomUUID(), name: "", type: "flight", url: "" },
            ])
          }
          className="mt-4 min-h-11 rounded-xl border border-blue-200 px-4 font-bold text-[#0857C9] hover:bg-blue-50 disabled:opacity-50"
        >
          + {t("addLink")}
        </button>
      </fieldset>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 font-semibold text-red-700"
        >
          {error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="min-h-14 w-full rounded-xl bg-[#0B6EFD] px-6 text-lg font-bold text-white hover:bg-[#0857C9] disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("publishingTrip") : t("publishTrip")}
      </button>
    </form>
  );
}
