"use client";

import {
  translate,
  tripCardPageSchema,
  type SupportedLocale,
  type TripCardPage,
} from "@viajeroshub/shared";
import { useState } from "react";

import { TripCard } from "./trip-card";

type SearchQuery = {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  flexibleMonth?: string;
};

export function SearchTripGrid({
  initialPage,
  query,
  locale,
}: {
  initialPage: TripCardPage;
  query: SearchQuery;
  locale: SupportedLocale;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const search = new URLSearchParams({
        locale,
        limit: "12",
        cursor: nextCursor,
        includeTotal: "false",
      });
      Object.entries(query).forEach(([key, value]) => {
        if (value) search.set(key, value);
      });
      const response = await fetch(`/api/trips?${search.toString()}`);
      if (!response.ok) throw new Error(translate(locale, "searchError"));
      const page = tripCardPageSchema.parse(await response.json());
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : translate(locale, "searchError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((trip) => (
          <TripCard key={trip.id} trip={trip} locale={locale} />
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-5 text-center text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {nextCursor ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-blue-200 bg-white px-7 font-bold text-[#0857C9] shadow-sm transition hover:border-[#0B6EFD] hover:bg-[#EAF3FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6EFD] disabled:cursor-wait disabled:opacity-60"
          >
            {translate(locale, "loadMoreTrips")}
            {loading ? "…" : ""}
          </button>
        </div>
      ) : null}
    </>
  );
}
