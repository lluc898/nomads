import type { TripCard as TripCardData } from "@viajeroshub/shared";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TripCard } from "@/components/trip-card";
import {
  CardListSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/content-state";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function TripsScreen() {
  const router = useRouter();
  const { listMyTrips } = useAuth();
  const { locale, t } = useI18n();
  const [trips, setTrips] = useState<TripCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTrips(await listMyTrips(locale));
    } catch (caught) {
      console.warn("My trips load failed", caught);
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [listMyTrips, locale, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
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
          <View className="mt-6">
            <CardListSkeleton count={2} />
          </View>
        ) : null}
        {error ? (
          <View className="mt-6">
            <ErrorState
              title={t("loadError")}
              retryLabel={t("retry")}
              onRetry={() => void load()}
            />
          </View>
        ) : null}
        {!loading && !error && !trips.length ? (
          <View className="mt-8">
            <EmptyState
              title={t("myTrips")}
              message={t("createTripDescription")}
              actions={[
                {
                  label: t("navCreate"),
                  onPress: () => router.push("/(tabs)/create"),
                },
                {
                  label: t("navExplore"),
                  onPress: () => router.push("/(tabs)"),
                },
              ]}
            />
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
