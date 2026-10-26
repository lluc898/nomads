import type { TripDetail } from "@viajeroshub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { WEB_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n-context";

export default function TripDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { getTrip } = useAuth();
  const { locale, t } = useI18n();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!slug) return;
    getTrip(slug, locale)
      .then((result) => {
        if (active) {
          setTrip(result);
          setError(null);
        }
      })
      .catch((caught) => {
        if (active) {
          setTrip(null);
          setError(caught instanceof Error ? caught.message : "Error");
        }
      });
    return () => {
      active = false;
    };
  }, [getTrip, locale, slug]);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
        >
          <Text className="text-2xl font-bold text-slate-800">‹</Text>
        </Pressable>
        <Text className="ml-3 text-lg font-extrabold text-slate-950">
          {t("tripDetails")}
        </Text>
      </View>

      {!trip && !error ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0B6EFD" size="large" />
        </View>
      ) : null}

      {error ? (
        <View className="flex-1 justify-center px-5">
          <Text className="rounded-2xl bg-red-50 p-5 text-center font-semibold text-red-700">
            {error}
          </Text>
        </View>
      ) : null}

      {trip ? (
        <ScrollView
          contentContainerClassName="pb-12"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-brand-50 px-5 py-8">
            <View className="self-start rounded-full bg-white px-3 py-1">
              <Text className="text-brand-700 text-xs font-bold">
                {trip.visibility === "public" ? t("public") : t("private")}
              </Text>
            </View>
            <Text className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950">
              {t("tripTo", { destination: trip.destination })}
            </Text>
            <Text className="mt-3 text-lg font-bold text-slate-700">
              {trip.origin} → {trip.destination}
            </Text>
            <Text className="mt-2 leading-6 text-slate-600">
              {dateFormatter.format(
                new Date(`${trip.departureDate}T00:00:00Z`),
              )}
              {" – "}
              {dateFormatter.format(new Date(`${trip.returnDate}T00:00:00Z`))}
            </Text>
          </View>

          <View className="gap-5 px-5 pt-5">
            <View className="rounded-3xl border border-slate-200 bg-white p-5">
              <Text className="text-xl font-extrabold text-slate-950">
                {t("description")}
              </Text>
              <Text className="mt-3 text-base leading-7 text-slate-600">
                {trip.description || t("createTripDescription")}
              </Text>
            </View>

            <View className="rounded-3xl border border-slate-200 bg-white p-5">
              <Text className="text-sm text-slate-500">
                {t("createdBy", {
                  name:
                    trip.creator?.name ??
                    trip.creator?.username ??
                    "ViajerosHub",
                })}
              </Text>
              {trip.budget !== null ? (
                <View className="mt-5">
                  <Text className="text-sm text-slate-500">
                    {t("guidePrice")}
                  </Text>
                  <Text className="mt-1 text-2xl font-extrabold text-slate-950">
                    {trip.budget} {trip.currency}
                  </Text>
                </View>
              ) : null}
              <View className="mt-5">
                <Text className="text-sm text-slate-500">
                  {t("groupSizeOptional")}
                </Text>
                <Text className="mt-1 font-bold text-slate-900">
                  {trip.maxParticipants ?? t("unlimited")}
                </Text>
              </View>
            </View>

            {trip.links.length ? (
              <View className="rounded-3xl border border-slate-200 bg-white p-5">
                <Text className="text-xl font-extrabold text-slate-950">
                  {t("bookingLinks")}
                </Text>
                <Text className="mt-2 text-sm leading-5 text-slate-500">
                  {t("affiliateDisclosure")}
                </Text>
                <View className="mt-4 gap-3">
                  {trip.links.map((link) => (
                    <Pressable
                      key={link.id}
                      accessibilityRole="link"
                      onPress={() =>
                        Linking.openURL(`${WEB_URL}/go/${link.id}`)
                      }
                      className="min-h-14 flex-row items-center justify-between rounded-xl border border-blue-200 px-4 active:bg-blue-50"
                    >
                      <Text className="text-brand-700 flex-1 font-bold">
                        {link.type === "flight" ? "✈️" : "🏨"} {link.name}
                      </Text>
                      <Text className="text-brand-700 ml-3 text-xl">↗</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
