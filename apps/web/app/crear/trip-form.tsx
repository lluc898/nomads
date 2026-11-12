"use client";

import type { TripLinkInput } from "@viajeroshub/shared";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { LocationCombobox } from "@/components/location-combobox";
import { TravelDatePicker } from "@/components/travel-date-picker";

type EditableLink = TripLinkInput & { key: string };

export function CreateTripForm() {
  const { t } = useI18n();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [links, setLinks] = useState<EditableLink[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Record<string, string>>({});
  const titles = [
    t("routeAndDates"),
    t("tripDetails"),
    t("bookingLinks"),
    t("privacy"),
    t("reviewAndPublish"),
  ];
  const card =
    "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";

  function values() {
    return new FormData(formRef.current ?? undefined);
  }

  function advance() {
    const data = values();
    setError(null);
    if (
      step === 0 &&
      (!data.get("origin") ||
        !data.get("destination") ||
        !data.get("departureDate") ||
        !data.get("returnDate"))
    ) {
      setError(t("routeRequired"));
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(
            '[data-step="0"] input:not([type="hidden"])',
          )
          ?.focus(),
      );
      return;
    }
    if (
      step === 2 &&
      links.some((link) => !link.name.trim() || !/^https:\/\//i.test(link.url))
    ) {
      setError(t("linkRequired"));
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[data-step="2"] input')
          ?.focus(),
      );
      return;
    }
    if (step === 3) {
      setReview({
        origin: String(data.get("originLabel") ?? data.get("origin") ?? ""),
        destination: String(
          data.get("destinationLabel") ?? data.get("destination") ?? "",
        ),
        dates: `${data.get("departureDate") ?? ""} - ${data.get("returnDate") ?? ""}`,
        description: String(data.get("description") ?? ""),
        budget: String(data.get("budget") ?? ""),
        group: String(data.get("maxParticipants") ?? ""),
        visibility: String(data.get("visibility") ?? "public"),
      });
    }
    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 4) return advance();
    if (pending) return;
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const budget = String(data.get("budget") ?? "").replace(",", ".");
    const maxParticipants = String(data.get("maxParticipants") ?? "");
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: data.get("origin"),
          destination: data.get("destination"),
          departureDate: data.get("departureDate"),
          returnDate: data.get("returnDate"),
          description: data.get("description"),
          visibility: data.get("visibility"),
          budget: budget ? Number(budget) : null,
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
          links: links.map(({ name, type, url }) => ({ name, type, url })),
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? t("loadError"));
      router.push("/mis-viajes?created=1");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("loadError"));
      setPending(false);
    }
  }

  function updateLink(key: string, patch: Partial<TripLinkInput>) {
    setLinks((current) =>
      current.map((link) => (link.key === key ? { ...link, ...patch } : link)),
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="mt-8 space-y-6">
      <div aria-live="polite" className={card}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#0857C9]">
              {t("stepOfTotal", { current: step + 1, total: 5 })}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              {titles[step]}
            </h2>
          </div>
          <span className="text-sm font-bold text-slate-500">
            {Math.round(((step + 1) / 5) * 100)}%
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#0B6EFD] transition-[width]"
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      <fieldset data-step="0" hidden={step !== 0} className={card}>
        <legend className="sr-only">{t("routeAndDates")}</legend>
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

      <fieldset data-step="1" hidden={step !== 1} className={card}>
        <legend className="sr-only">{t("tripDetails")}</legend>
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
      </fieldset>

      <fieldset data-step="2" hidden={step !== 2} className={card}>
        <legend className="sr-only">{t("bookingLinks")}</legend>
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

      <fieldset data-step="3" hidden={step !== 3} className={card}>
        <legend className="sr-only">{t("privacy")}</legend>
        <label className="block font-bold text-slate-800">
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

      <section
        hidden={step !== 4}
        className={card}
        aria-labelledby="review-title"
      >
        <h3 id="review-title" className="text-xl font-extrabold text-slate-950">
          {t("reviewAndPublish")}
        </h3>
        <p className="mt-2 text-slate-600">{t("reviewSummary")}</p>
        <ReviewRow
          label={t("routeAndDates")}
          value={`${review.origin} → ${review.destination}\n${review.dates}`}
          onEdit={() => setStep(0)}
          edit={t("edit")}
        />
        <ReviewRow
          label={t("tripDetails")}
          value={
            [
              review.description,
              review.budget ? `${review.budget} EUR` : "",
              review.group,
            ]
              .filter(Boolean)
              .join(" · ") || "-"
          }
          onEdit={() => setStep(1)}
          edit={t("edit")}
        />
        <ReviewRow
          label={t("bookingLinks")}
          value={links.length ? links.map((link) => link.name).join(", ") : "-"}
          onEdit={() => setStep(2)}
          edit={t("edit")}
        />
        <ReviewRow
          label={t("privacy")}
          value={review.visibility === "private" ? t("private") : t("public")}
          onEdit={() => setStep(3)}
          edit={t("edit")}
        />
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 font-semibold text-red-700"
        >
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setStep((current) => current - 1);
            }}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-6 font-bold text-slate-700"
          >
            {t("back")}
          </button>
        ) : (
          <span />
        )}
        <button
          type={step === 4 ? "submit" : "button"}
          disabled={pending}
          onClick={step === 4 ? undefined : advance}
          className="min-h-14 rounded-xl bg-[#0B6EFD] px-6 text-lg font-bold text-white hover:bg-[#0857C9] disabled:opacity-60"
        >
          {pending
            ? t("publishingTrip")
            : step === 4
              ? t("publishTrip")
              : t("next")}
        </button>
      </div>
    </form>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  edit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  edit: string;
}) {
  return (
    <div className="mt-5 flex items-start justify-between gap-4 border-t border-slate-100 pt-5">
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-1 font-semibold whitespace-pre-line text-slate-900">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="min-h-11 rounded-xl px-3 font-bold text-[#0857C9] hover:bg-blue-50"
      >
        {edit}
      </button>
    </div>
  );
}
