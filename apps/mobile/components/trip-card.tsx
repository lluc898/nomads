import {
  translate,
  type SupportedLocale,
  type TripCard as TripCardData,
} from "@viajeroshub/shared";
import { Pressable, Text, View } from "react-native";

const tones = {
  sea: "bg-cyan-600",
  sunset: "bg-orange-500",
  forest: "bg-emerald-700",
};

export function TripCard({
  trip,
  locale = "es",
}: {
  trip: TripCardData;
  locale?: SupportedLocale;
}) {
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver viaje a ${trip.destination}`}
      className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white active:opacity-90"
    >
      <View className={`h-32 justify-end p-4 ${tones[trip.tone]}`}>
        <View className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1">
          <Text className="text-xs font-bold text-slate-800">
            {trip.visibility === "public" ? t("public") : t("private")}
          </Text>
        </View>
        <Text className="text-xs font-semibold text-white/80">
          {t("from").toUpperCase()} {trip.origin.toUpperCase()}
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">
          {trip.destination}
        </Text>
      </View>
      <View className="p-4">
        <Text className="font-semibold text-slate-700">{trip.dateLabel}</Text>
        <Text className="mt-2 text-sm text-slate-500">
          {trip.availablePlaces ?? t("unlimited")} {t("availablePlaces")}
        </Text>
        <View className="mt-4 flex-row items-end justify-between border-t border-slate-100 pt-3">
          <View>
            <Text className="text-xs text-slate-500">{t("guidePrice")}</Text>
            <Text className="text-lg font-extrabold text-slate-950">
              {trip.priceFrom
                ? t("priceFrom", { price: trip.priceFrom })
                : t("undefinedPrice")}
            </Text>
          </View>
          <View className="rounded-xl bg-brand-50 px-4 py-3">
            <Text className="font-bold text-brand-600">{t("viewTrip")}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
