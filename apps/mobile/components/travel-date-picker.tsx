import type { TripDateSelection } from "@viajeroshub/shared";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

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

function shortDate(value: string) {
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function TravelDatePicker({
  onChange,
}: {
  onChange: (selection: TripDateSelection | null) => void;
}) {
  const today = new Date();
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<DateMode>("exact");
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flexibleYear, setFlexibleYear] = useState(today.getFullYear());
  const [flexibleMonth, setFlexibleMonth] = useState("");

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const todayIso = toIsoDate(today);
  const earliestMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const label =
    mode === "flexible"
      ? flexibleMonth
        ? `${months[Number(flexibleMonth.slice(5)) - 1]} ${flexibleMonth.slice(0, 4)}`
        : "Elige un mes completo"
      : departureDate && returnDate
        ? `${shortDate(departureDate)} – ${shortDate(returnDate)}`
        : departureDate
          ? `${shortDate(departureDate)} – Elige vuelta`
          : "Elige ida y vuelta";

  function changeMode(nextMode: DateMode) {
    setMode(nextMode);
    onChange(
      nextMode === "exact" && departureDate && returnDate
        ? { dateMode: "exact", departureDate, returnDate }
        : nextMode === "flexible" && flexibleMonth
          ? { dateMode: "flexible", flexibleMonth }
          : null,
    );
  }

  function selectExactDate(value: string) {
    if (!departureDate || returnDate) {
      setDepartureDate(value);
      setReturnDate("");
      onChange(null);
      return;
    }
    if (value < departureDate) {
      setDepartureDate(value);
      onChange(null);
      return;
    }
    setReturnDate(value);
    onChange({ dateMode: "exact", departureDate, returnDate: value });
    setExpanded(false);
  }

  function moveMonth(amount: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  return (
    <View>
      <Text className="mb-2 text-sm font-bold text-slate-800">Cuándo</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Fechas del viaje: ${label}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        className="min-h-14 flex-row items-center rounded-xl border border-slate-300 bg-white px-4 active:bg-slate-50"
      >
        <Text className="mr-3 text-xl text-brand-500">▣</Text>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-slate-500">
            {mode === "exact" ? "Fechas exactas" : "Mes flexible"}
          </Text>
          <Text
            className={`mt-0.5 ${
              departureDate || flexibleMonth
                ? "font-bold text-slate-950"
                : "text-slate-400"
            }`}
          >
            {label}
          </Text>
        </View>
        <Text className="text-slate-500">{expanded ? "⌃" : "⌄"}</Text>
      </Pressable>

      {expanded ? (
        <View className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <View className="flex-row rounded-xl bg-slate-200 p-1">
            {(["exact", "flexible"] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === option }}
                onPress={() => changeMode(option)}
                className={`min-h-10 flex-1 items-center justify-center rounded-lg ${
                  mode === option ? "bg-white" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    mode === option ? "text-brand-600" : "text-slate-600"
                  }`}
                >
                  {option === "exact" ? "Fechas exactas" : "Mes flexible"}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === "exact" ? (
            <View className="mt-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mes anterior"
                  disabled={visibleMonth <= earliestMonth}
                  onPress={() => moveMonth(-1)}
                  className="h-11 w-11 items-center justify-center rounded-xl active:bg-slate-200 disabled:opacity-30"
                >
                  <Text className="text-2xl text-slate-700">‹</Text>
                </Pressable>
                <Text className="font-extrabold text-slate-950">
                  {months[month]} {year}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mes siguiente"
                  onPress={() => moveMonth(1)}
                  className="h-11 w-11 items-center justify-center rounded-xl active:bg-slate-200"
                >
                  <Text className="text-2xl text-slate-700">›</Text>
                </Pressable>
              </View>
              <View className="flex-row">
                {weekdays.map((weekday) => (
                  <View key={weekday} style={{ width: "14.2857%" }}>
                    <Text className="text-center text-xs font-bold text-slate-400">
                      {weekday}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="mt-1 flex-row flex-wrap">
                {cells.map((day, index) => {
                  if (!day) {
                    return (
                      <View
                        key={`empty-${index}`}
                        className="h-10"
                        style={{ width: "14.2857%" }}
                      />
                    );
                  }
                  const value = toIsoDate(new Date(year, month, day));
                  const endpoint =
                    value === departureDate || value === returnDate;
                  const inRange =
                    Boolean(departureDate && returnDate) &&
                    value > departureDate &&
                    value < returnDate;
                  return (
                    <View
                      key={value}
                      className="h-10 items-center justify-center"
                      style={{ width: "14.2857%" }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${day} de ${months[month]} de ${year}`}
                        accessibilityState={{
                          disabled: value < todayIso,
                          selected: endpoint || inRange,
                        }}
                        disabled={value < todayIso}
                        onPress={() => selectExactDate(value)}
                        className={`h-9 w-9 items-center justify-center rounded-full disabled:opacity-25 ${
                          endpoint
                            ? "bg-brand-500"
                            : inRange
                              ? "bg-brand-50"
                              : "bg-transparent active:bg-slate-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            endpoint ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <Text className="mt-2 text-center text-xs text-slate-500">
                {departureDate && !returnDate
                  ? "Ahora elige la fecha de vuelta"
                  : "Selecciona primero la ida y después la vuelta"}
              </Text>
            </View>
          ) : (
            <View className="mt-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Año anterior"
                  disabled={flexibleYear <= today.getFullYear()}
                  onPress={() => setFlexibleYear((current) => current - 1)}
                  className="h-11 w-11 items-center justify-center rounded-xl active:bg-slate-200 disabled:opacity-30"
                >
                  <Text className="text-2xl text-slate-700">‹</Text>
                </Pressable>
                <Text className="font-extrabold text-slate-950">
                  {flexibleYear}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Año siguiente"
                  onPress={() => setFlexibleYear((current) => current + 1)}
                  className="h-11 w-11 items-center justify-center rounded-xl active:bg-slate-200"
                >
                  <Text className="text-2xl text-slate-700">›</Text>
                </Pressable>
              </View>
              <View className="flex-row flex-wrap">
                {months.map((monthName, index) => {
                  const value = monthKey(flexibleYear, index);
                  const disabled =
                    value < monthKey(today.getFullYear(), today.getMonth());
                  const selected = value === flexibleMonth;
                  return (
                    <View
                      key={monthName}
                      className="p-1"
                      style={{ width: "33.333%" }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled, selected }}
                        disabled={disabled}
                        onPress={() => {
                          setFlexibleMonth(value);
                          onChange({
                            dateMode: "flexible",
                            flexibleMonth: value,
                          });
                          setExpanded(false);
                        }}
                        className={`min-h-11 items-center justify-center rounded-xl border disabled:opacity-30 ${
                          selected
                            ? "border-brand-500 bg-brand-500"
                            : "border-slate-200 bg-white active:bg-brand-50"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            selected ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {monthName.slice(0, 3)}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <Text className="mt-2 text-center text-xs text-slate-500">
                Verás viajes que salgan en cualquier fecha del mes.
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
