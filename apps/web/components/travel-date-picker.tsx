"use client";

import { useEffect, useId, useRef, useState } from "react";

import { CalendarIcon } from "./icons";
import { useI18n } from "./i18n-provider";

type DateMode = "exact" | "flexible";

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function formatShortDate(value: string, locale: string) {
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(year !== new Date().getFullYear() ? { year: "numeric" } : {}),
  }).format(new Date(year, month - 1, day));
}

function CalendarGrid({
  visibleMonth,
  departureDate,
  returnDate,
  onSelect,
  locale,
}: {
  visibleMonth: Date;
  departureDate: string;
  returnDate: string;
  onSelect: (date: string) => void;
  locale: string;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toIsoDate(new Date());
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
      new Date(2026, 0, 5 + index),
    ),
  );
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 },
    (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    },
  );

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold text-slate-400">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const value = toIsoDate(new Date(year, month, day));
          const disabled = value < today;
          const endpoint = value === departureDate || value === returnDate;
          const inRange =
            Boolean(departureDate && returnDate) &&
            value > departureDate &&
            value < returnDate;

          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(value)}
              aria-label={new Intl.DateTimeFormat(locale, {
                dateStyle: "full",
              }).format(new Date(year, month, day))}
              aria-pressed={endpoint || inRange}
              className={`mx-auto grid size-9 place-items-center rounded-full text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6EFD] disabled:cursor-not-allowed disabled:text-slate-300 ${
                endpoint
                  ? "bg-[#0B6EFD] text-white"
                  : inRange
                    ? "bg-[#EAF3FF] text-[#0857C9]"
                    : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TravelDatePicker() {
  const { locale, t } = useI18n();
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DateMode>("exact");
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flexibleYear, setFlexibleYear] = useState(today.getFullYear());
  const [flexibleMonth, setFlexibleMonth] = useState("");
  const months = Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(
      new Date(2026, index, 1),
    ),
  );

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const earliestMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoToPreviousMonth = visibleMonth > earliestMonth;
  const label =
    mode === "flexible"
      ? flexibleMonth
        ? `${months[Number(flexibleMonth.slice(5)) - 1]} ${flexibleMonth.slice(0, 4)}`
        : t("chooseMonth")
      : departureDate && returnDate
        ? `${formatShortDate(departureDate, locale)} – ${formatShortDate(returnDate, locale)}`
        : departureDate
          ? `${formatShortDate(departureDate, locale)} – ${t("chooseReturn")}`
          : t("chooseDates");

  function selectExactDate(value: string) {
    if (!departureDate || returnDate) {
      setDepartureDate(value);
      setReturnDate("");
      return;
    }
    if (value < departureDate) {
      setDepartureDate(value);
      return;
    }
    setReturnDate(value);
  }

  function moveMonth(amount: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0 flex-1 border-b border-slate-200 md:border-r md:border-b-0"
    >
      <input type="hidden" name="dateMode" value={mode} />
      {mode === "exact" ? (
        <>
          <input type="hidden" name="departureDate" value={departureDate} />
          <input type="hidden" name="returnDate" value={returnDate} />
        </>
      ) : (
        <input type="hidden" name="flexibleMonth" value={flexibleMonth} />
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B6EFD]"
      >
        <span className="text-[#0B6EFD]">
          <CalendarIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-slate-500">
            {t("when")}
          </span>
          <span
            className={`mt-0.5 block truncate text-[15px] ${
              departureDate || flexibleMonth
                ? "font-semibold text-slate-900"
                : "text-slate-400"
            }`}
          >
            {label}
          </span>
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Seleccionar fechas del viaje"
          className="absolute top-[calc(100%+8px)] right-0 z-40 w-[min(23rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,.2)]"
        >
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            {(["exact", "flexible"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`min-h-10 rounded-lg px-3 text-sm font-bold transition ${
                  mode === option
                    ? "bg-white text-[#0857C9] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {option === "exact" ? t("exactDates") : t("flexibleMonth")}
              </button>
            ))}
          </div>

          {mode === "exact" ? (
            <div className="mt-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  aria-label={t("previousMonth")}
                  disabled={!canGoToPreviousMonth}
                  onClick={() => moveMonth(-1)}
                  className="grid size-10 place-items-center rounded-lg text-xl text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
                >
                  ‹
                </button>
                <p className="font-extrabold text-slate-900">
                  {months[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                </p>
                <button
                  type="button"
                  aria-label={t("nextMonth")}
                  onClick={() => moveMonth(1)}
                  className="grid size-10 place-items-center rounded-lg text-xl text-slate-700 hover:bg-slate-100"
                >
                  ›
                </button>
              </div>
              <CalendarGrid
                visibleMonth={visibleMonth}
                departureDate={departureDate}
                returnDate={returnDate}
                onSelect={selectExactDate}
                locale={locale}
              />
              <p className="mt-3 text-center text-xs text-slate-500">
                {departureDate && !returnDate
                  ? t("nowChooseReturn")
                  : t("chooseDepartureThenReturn")}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  aria-label={t("previousYear")}
                  disabled={flexibleYear <= today.getFullYear()}
                  onClick={() => setFlexibleYear((year) => year - 1)}
                  className="grid size-10 place-items-center rounded-lg text-xl text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
                >
                  ‹
                </button>
                <p className="font-extrabold text-slate-900">{flexibleYear}</p>
                <button
                  type="button"
                  aria-label={t("nextYear")}
                  onClick={() => setFlexibleYear((year) => year + 1)}
                  className="grid size-10 place-items-center rounded-lg text-xl text-slate-700 hover:bg-slate-100"
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => {
                  const value = monthKey(flexibleYear, index);
                  const currentMonth = monthKey(
                    today.getFullYear(),
                    today.getMonth(),
                  );
                  const disabled = value < currentMonth;
                  const selected = value === flexibleMonth;
                  return (
                    <button
                      key={month}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setFlexibleMonth(value);
                        setOpen(false);
                      }}
                      className={`min-h-11 rounded-xl text-sm font-bold transition disabled:text-slate-300 ${
                        selected
                          ? "bg-[#0B6EFD] text-white"
                          : "border border-slate-200 text-slate-700 hover:border-[#0B6EFD] hover:bg-[#EAF3FF]"
                      }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                {t("wholeMonthHelp")}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
