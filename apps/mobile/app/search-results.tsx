import type { TripCard as TripCardData } from "@viajeroshub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeSearch } from "@/components/home-search";
import { TripCard } from "@/components/trip-card";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import {
  parseTripSearch,
  serializeTripSearch,
  type TripSearchSelection,
} from "@/lib/trip-search";

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { locale, t } = useI18n();
  const initialSearch = useMemo(() => parseTripSearch(params), [params]);
  const [search, setSearch] = useState<TripSearchSelection | null>(
    initialSearch,
  );
  const [editing, setEditing] = useState(false);
  const [trips, setTrips] = useState<TripCardData[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!search) return;
    let active = true;
    api
      .listTrips({
        origin: search.origin.id,
        destination: search.destination.id,
        ...(search.dates.dateMode === "exact"
          ? {
              departureDate: search.dates.departureDate,
              returnDate: search.dates.returnDate,
            }
          : { flexibleMonth: search.dates.flexibleMonth }),
        locale,
        limit: 10,
      })
      .then((page) => {
        if (active) {
          setTrips(page.items);
          setNextCursor(page.nextCursor);
          setTotal(page.total);
        }
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : t("searchError"));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, [locale, reloadKey, search, t]);

  if (!search) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-center text-2xl font-extrabold text-slate-950">
          {t("searchExpired")}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)")}
          className="mt-6 min-h-12 items-center justify-center rounded-xl bg-brand-500 px-6"
        >
          <Text className="font-bold text-white">{t("backToSearch")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const dateLabel = formatDates(search, locale);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="border-b border-slate-200 bg-white px-5 pb-4 pt-2">
        <View className="flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            onPress={() => router.back()}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          >
            <Text className="text-2xl text-slate-800">‹</Text>
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("searchResults")}
            </Text>
            <Text className="mt-0.5 text-2xl font-extrabold text-slate-950">
              {t("yourTripOptions")}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-blue-100 bg-brand-50 p-4">
          <View className="flex-row items-start justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text
                className="text-lg font-extrabold text-slate-950"
                numberOfLines={1}
              >
                {search.origin.name} → {search.destination.name}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-600">
                {dateLabel}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("modifySearch")}
              onPress={() => setEditing((current) => !current)}
              className="min-h-11 items-center justify-center rounded-xl bg-white px-4 shadow-sm active:bg-slate-100"
            >
              <Text className="font-bold text-brand-600">
                {editing ? t("close") : t("modifySearch")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-10 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#0B6EFD"
            onRefresh={() => {
              setRefreshing(true);
              setError(null);
              setReloadKey((current) => current + 1);
            }}
          />
        }
      >
        {editing ? (
          <View className="mb-6">
            <HomeSearch
              key={`${search.origin.id}-${search.destination.id}-${dateLabel}`}
              initialValue={search}
              loading={loading}
              onSubmit={(nextSearch) => {
                setLoading(true);
                setError(null);
                setSearch(nextSearch);
                setEditing(false);
                router.setParams(serializeTripSearch(nextSearch));
              }}
            />
          </View>
        ) : null}

        {!loading && !error ? (
          <View className="mb-4 flex-row items-end justify-between">
            <View>
              <Text className="text-xl font-extrabold text-slate-950">
                {t("availableTrips")}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                {t("resultsFound", { count: total ?? trips.length })}
              </Text>
            </View>
          </View>
        ) : null}

        {loading ? <SearchSkeleton /> : null}

        {error && !loading ? (
          <View className="rounded-2xl border border-red-200 bg-white p-5">
            <Text className="text-lg font-extrabold text-slate-950">
              {t("searchError")}
            </Text>
            <Text className="mt-2 leading-6 text-slate-600">{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLoading(true);
                setError(null);
                setReloadKey((current) => current + 1);
              }}
              className="mt-4 min-h-12 items-center justify-center rounded-xl bg-brand-500 px-5"
            >
              <Text className="font-bold text-white">{t("retry")}</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && !trips.length ? (
          <View className="rounded-3xl border border-slate-200 bg-white p-6">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <Text className="text-2xl text-brand-600">⌕</Text>
            </View>
            <Text className="mt-5 text-xl font-extrabold text-slate-950">
              {t("noTripsRoute")}
            </Text>
            <Text className="mt-2 leading-6 text-slate-600">
              {t("noTripsHelp")}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditing(true)}
              className="mt-5 min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-brand-50 px-5"
            >
              <Text className="font-bold text-brand-600">
                {t("modifySearch")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error
          ? trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} locale={locale} />
            ))
          : null}

        {!loading && !error && nextCursor ? (
          <Pressable
            accessibilityRole="button"
            disabled={loadingMore}
            onPress={() => {
              setLoadingMore(true);
              setLoadMoreError(null);
              api
                .listTrips({
                  origin: search.origin.id,
                  destination: search.destination.id,
                  ...(search.dates.dateMode === "exact"
                    ? {
                        departureDate: search.dates.departureDate,
                        returnDate: search.dates.returnDate,
                      }
                    : { flexibleMonth: search.dates.flexibleMonth }),
                  locale,
                  limit: 10,
                  cursor: nextCursor,
                  includeTotal: false,
                })
                .then((page) => {
                  setTrips((current) => [...current, ...page.items]);
                  setNextCursor(page.nextCursor);
                })
                .catch((caught: unknown) => {
                  setLoadMoreError(
                    caught instanceof Error ? caught.message : t("searchError"),
                  );
                })
                .finally(() => setLoadingMore(false));
            }}
            className="min-h-12 items-center justify-center rounded-full border border-blue-200 bg-white px-6 active:bg-brand-50 disabled:opacity-60"
          >
            <Text className="font-bold text-brand-600">
              {loadingMore ? `${t("loadMoreTrips")}…` : t("loadMoreTrips")}
            </Text>
          </Pressable>
        ) : null}
        {loadMoreError ? (
          <Text className="mt-3 text-center text-sm font-semibold text-red-700">
            {loadMoreError}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDates(search: TripSearchSelection, locale: string) {
  if (search.dates.dateMode === "flexible") {
    const [year, month] = search.dates.flexibleMonth.split("-").map(Number) as [
      number,
      number,
    ];
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  }
  return `${formatDate(search.dates.departureDate, locale)} – ${formatDate(
    search.dates.returnDate,
    locale,
  )}`;
}

function formatDate(value: string, locale: string) {
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function SearchSkeleton() {
  return (
    <View className="gap-4">
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          className="h-64 rounded-2xl border border-slate-200 bg-slate-200"
        />
      ))}
    </View>
  );
}
