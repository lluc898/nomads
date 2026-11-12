import type { TripCard as TripCardData } from "@viajeroshub/shared";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeSearch } from "@/components/home-search";
import {
  CardListSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/content-state";
import { LanguageSelector } from "@/components/language-selector";
import { NotificationBell } from "@/components/notification-bell";
import { TripCard } from "@/components/trip-card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { absoluteMediaUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n-context";

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const { locale, t } = useI18n();
  const avatarUrl = absoluteMediaUrl(profile?.image ?? null);
  const [featuredTrips, setFeaturedTrips] = useState<TripCardData[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .listTrips({ locale, limit: 3 })
      .then((page) => {
        if (active) setFeaturedTrips(page.items);
      })
      .catch((error: unknown) => {
        if (active)
          setTripsError(
            error instanceof Error ? error.message : t("searchError"),
          );
      })
      .finally(() => {
        if (active) setLoadingTrips(false);
      });
    return () => {
      active = false;
    };
  }, [locale, reloadKey, t]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-brand-50 px-5 pb-8 pt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-extrabold tracking-tight text-slate-950">
                Viajeros<Text className="text-brand-500">Hub</Text>
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                {t("homeQuestion")}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <LanguageSelector />
              <NotificationBell />
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="h-11 w-11 rounded-full bg-slate-200"
                />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-500">
                  <Text className="font-bold text-white">
                    {profile?.name?.[0]?.toUpperCase() ?? "V"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="pb-6 pt-8">
            <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("homeEyebrow")}
            </Text>
            <Text className="mt-3 text-4xl font-extrabold leading-[44px] tracking-tight text-slate-950">
              {t("homeTitle")}{" "}
              <Text className="text-brand-500">{t("homeTitleAccent")}</Text>
            </Text>
            <Text className="mt-3 text-base leading-6 text-slate-600">
              {t("homeSubtitle")}
            </Text>
          </View>

          <HomeSearch />
        </View>

        <View className="px-5 pb-5 pt-8">
          <View>
            <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("ideas")}
            </Text>
            <Text className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              {t("featured")}
            </Text>
          </View>
        </View>

        <View>
          {loadingTrips ? (
            <View className="mx-5">
              <CardListSkeleton count={1} />
            </View>
          ) : null}
          {tripsError && !loadingTrips ? (
            <View className="mx-5">
              <ErrorState
                title={t("searchError")}
                message={t("loadError")}
                retryLabel={t("retry")}
                onRetry={() => {
                  setLoadingTrips(true);
                  setTripsError(null);
                  setReloadKey((current) => current + 1);
                }}
              />
            </View>
          ) : null}
          {!loadingTrips && !tripsError && !featuredTrips.length ? (
            <View className="mx-5">
              <EmptyState
                title={t("noFeaturedTrips")}
                message={t("noFeaturedTripsHelp")}
                actions={[
                  {
                    label: t("navExplore"),
                    onPress: () =>
                      scrollRef.current?.scrollTo({ y: 0, animated: true }),
                  },
                  {
                    label: t("navCreate"),
                    onPress: () => router.push("/(tabs)/create"),
                  },
                ]}
              />
            </View>
          ) : null}
          {!loadingTrips && !tripsError ? (
            <ScrollView
              horizontal
              decelerationRate="fast"
              snapToInterval={Math.max(width - 40, 280) + 16}
              contentContainerClassName="gap-4 px-5"
              showsHorizontalScrollIndicator={false}
            >
              {featuredTrips.map((trip) => (
                <View
                  key={trip.id}
                  style={{ width: Math.max(width - 40, 280) }}
                >
                  <TripCard trip={trip} locale={locale} />
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
