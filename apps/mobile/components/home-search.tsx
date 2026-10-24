import type {
  TravelLocation,
  TripCard as TripCardData,
  TripDateSelection,
} from "@viajeroshub/shared";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { LocationPicker } from "@/components/location-picker";
import { TravelDatePicker } from "@/components/travel-date-picker";
import { TripCard } from "@/components/trip-card";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

export function HomeSearch() {
  const { locale, t } = useI18n();
  const [origin, setOrigin] = useState<TravelLocation | null>(null);
  const [destination, setDestination] = useState<TravelLocation | null>(null);
  const [dates, setDates] = useState<TripDateSelection | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripCardData[]>([]);

  async function search() {
    if (!origin || !destination || !dates) return;
    setLoading(true);
    setError(null);
    setSubmitted(true);
    try {
      setTrips(
        await api.listTrips({
          origin: origin.id,
          destination: destination.id,
          ...(dates.dateMode === "exact"
            ? {
                departureDate: dates.departureDate,
                returnDate: dates.returnDate,
              }
            : { flexibleMonth: dates.flexibleMonth }),
          locale,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <View className="gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <LocationPicker
          label={t("from")}
          placeholder={t("locationPlaceholder")}
          value={origin}
          onChange={(location) => {
            setOrigin(location);
            setSubmitted(false);
          }}
        />
        <LocationPicker
          label={t("to")}
          placeholder={t("anywhere")}
          includeAnywhere
          value={destination}
          onChange={(location) => {
            setDestination(location);
            setSubmitted(false);
          }}
        />
        <TravelDatePicker
          onChange={(selection) => {
            setDates(selection);
            setSubmitted(false);
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("searchTrips")}
          accessibilityState={{
            disabled: !origin || !destination || !dates,
          }}
          disabled={!origin || !destination || !dates}
          onPress={search}
          className="h-14 flex-row items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-40"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="mr-2 text-lg text-white">⌕</Text>
              <Text className="text-base font-bold text-white">
                {t("searchTrips")}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {error ? (
        <Text className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </Text>
      ) : null}
      {submitted && !loading && !error && !trips.length ? (
        <View className="mt-4 rounded-2xl border border-blue-200 bg-white p-5">
          <Text className="text-lg font-extrabold text-slate-950">
            {t("noTripsRoute")}
          </Text>
          <Text className="mt-2 leading-6 text-slate-600">
            {t("noTripsHelp")}
          </Text>
        </View>
      ) : null}
      {trips.length ? (
        <View className="mt-5">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} locale={locale} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
