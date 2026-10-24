"use client";

import type { TravelLocation } from "@viajeroshub/shared";
import { useEffect, useRef, useState } from "react";

import { MapPinIcon } from "@/components/icons";

type LocationComboboxProps = {
  label: string;
  name: string;
  placeholder: string;
  includeAnywhere?: boolean;
};

export function LocationCombobox({
  label,
  name,
  placeholder,
  includeAnywhere = false,
}: LocationComboboxProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TravelLocation | null>(null);
  const [results, setResults] = useState<TravelLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open || selected) return;
    if (!query.trim() && !includeAnywhere) return;

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const search = new URLSearchParams({ q: query });
        if (includeAnywhere) search.set("includeAnywhere", "true");
        const response = await fetch(`/api/locations?${search}`, {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("No se han podido buscar ubicaciones.");
        const locations = (await response.json()) as TravelLocation[];
        if (requestId.current === currentRequest) {
          setResults(locations);
          setActiveIndex(0);
        }
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError"))
          setResults([]);
      } finally {
        if (requestId.current === currentRequest) setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [includeAnywhere, open, query, selected]);

  function choose(location: TravelLocation) {
    setSelected(location);
    setQuery(location.name);
    setOpen(false);
  }

  return (
    <div className="relative min-w-0 flex-1 border-b border-slate-200 md:border-r md:border-b-0">
      <label className="group flex min-h-[68px] items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
        <span className="text-[#0B6EFD]">
          <MapPinIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-slate-500">
            {label}
          </span>
          <input type="hidden" name={name} value={selected?.id ?? ""} />
          <input
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${name}-options`}
            aria-autocomplete="list"
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(event) => {
              setSelected(null);
              setQuery(event.target.value);
              if (!event.target.value.trim() && !includeAnywhere)
                setResults([]);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) =>
                  Math.min(index + 1, results.length - 1),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (
                event.key === "Enter" &&
                open &&
                results[activeIndex]
              ) {
                event.preventDefault();
                choose(results[activeIndex]);
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
          />
        </span>
      </label>

      {open ? (
        <div
          id={`${name}-options`}
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 z-50 max-h-80 w-full min-w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl md:w-[420px]"
        >
          {loading ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              Buscando ubicaciones…
            </p>
          ) : results.length ? (
            results.map((location, index) => (
              <button
                key={location.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(location)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${index === activeIndex ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">
                  {location.kind === "airport"
                    ? "✈"
                    : location.kind === "country"
                      ? "◎"
                      : "✦"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {location.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {location.subtitle}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-slate-500">
              {query.trim()
                ? "No hemos encontrado países ni aeropuertos."
                : "Escribe un país, ciudad, IATA o aeropuerto."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
