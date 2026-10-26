import type { TravelLocation, TripDateSelection } from "@viajeroshub/shared";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { LocationPicker } from "@/components/location-picker";
import { TravelDatePicker } from "@/components/travel-date-picker";
import { useI18n } from "@/lib/i18n-context";
import {
  serializeTripSearch,
  type TripSearchSelection,
} from "@/lib/trip-search";

type HomeSearchProps = {
  initialValue?: TripSearchSelection | null;
  loading?: boolean;
  onSubmit?: (search: TripSearchSelection) => void;
};

export function HomeSearch({
  initialValue = null,
  loading = false,
  onSubmit,
}: HomeSearchProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [origin, setOrigin] = useState<TravelLocation | null>(
    initialValue?.origin ?? null,
  );
  const [destination, setDestination] = useState<TravelLocation | null>(
    initialValue?.destination ?? null,
  );
  const [dates, setDates] = useState<TripDateSelection | null>(
    initialValue?.dates ?? null,
  );

  function search() {
    if (!origin || !destination || !dates) return;
    const selection = { origin, destination, dates };
    if (onSubmit) {
      onSubmit(selection);
      return;
    }
    router.push({
      pathname: "/search-results",
      params: serializeTripSearch(selection),
    });
  }

  return (
    <View className="gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <LocationPicker
        label={t("from")}
        placeholder={t("locationPlaceholder")}
        value={origin}
        onChange={setOrigin}
      />
      <LocationPicker
        label={t("to")}
        placeholder={t("anywhere")}
        includeAnywhere
        value={destination}
        onChange={setDestination}
      />
      <TravelDatePicker initialValue={dates} onChange={setDates} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("searchTrips")}
        accessibilityState={{
          disabled: !origin || !destination || !dates || loading,
        }}
        disabled={!origin || !destination || !dates || loading}
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
  );
}
