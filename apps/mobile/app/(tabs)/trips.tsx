import type { TripCard as TripCardData } from "@viajeroshub/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TripCard } from "@/components/trip-card";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function TripsScreen() {
  const { listMyTrips } = useAuth();
  const { locale, t } = useI18n();
  const [trips, setTrips] = useState<TripCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      listMyTrips(locale)
        .then((result) => {
          if (active) setTrips(result);
        })
        .catch((caught) => {
          if (active)
            setError(caught instanceof Error ? caught.message : "Error");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [listMyTrips, locale]),
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-3">
        <Text className="text-3xl font-extrabold tracking-tight text-slate-950">
          {t("myTrips")}
        </Text>
        <Text className="mt-2 leading-6 text-slate-600">
          {t("myTripsDescription")}
        </Text>
        {loading ? (
          <ActivityIndicator className="mt-10" color="#0B6EFD" />
        ) : null}
        {error ? (
          <Text className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </Text>
        ) : null}
        {!loading && !error && !trips.length ? (
          <View className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-8">
            <Text className="text-center font-bold text-slate-700">
              {t("createTripDescription")}
            </Text>
          </View>
        ) : null}
        <View className="mt-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} locale={locale} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
