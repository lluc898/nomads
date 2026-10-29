"use client";

import {
  translate,
  type SupportedLocale,
  type TripCard as TripCardData,
} from "@viajeroshub/shared";
import { useEffect, useRef, useState } from "react";

import { ArrowRightIcon } from "./icons";
import { TripCard } from "./trip-card";

export function FeaturedTripsCarousel({
  trips,
  locale,
}: {
  trips: TripCardData[];
  locale: SupportedLocale;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [canMove, setCanMove] = useState({ previous: false, next: false });

  function updatePosition() {
    const element = track.current;
    if (!element) return;
    const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft;
    setCanMove({
      previous: element.scrollLeft > 4,
      next: remaining > 4,
    });
  }

  function move(direction: -1 | 1) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.9, behavior: "smooth" });
  }

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  const activeIndex = !canMove.previous
    ? 0
    : !canMove.next
      ? trips.length - 1
      : Math.min(1, trips.length - 1);

  if (!trips.length) return null;

  return (
    <div className="mt-9">
      <div
        ref={track}
        onScroll={updatePosition}
        className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
      >
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="w-[88vw] max-w-[390px] shrink-0 snap-start [&>article]:h-full md:w-[calc((100%-1.25rem)/2)] md:max-w-none lg:w-[calc((100%-2.5rem)/3)]"
          >
            <TripCard trip={trip} locale={locale} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 md:justify-end">
        <button
          type="button"
          aria-label={translate(locale, "previousTrip")}
          onClick={() => move(-1)}
          disabled={!canMove.previous}
          className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-[#0B6EFD] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowRightIcon className="size-4 rotate-180" />
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {trips.map((trip, index) => (
            <span
              key={trip.id}
              className={`h-1.5 rounded-full ${index === activeIndex ? "w-5 bg-[#0B6EFD]" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={translate(locale, "nextTrip")}
          onClick={() => move(1)}
          disabled={!canMove.next}
          className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-[#0B6EFD] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
