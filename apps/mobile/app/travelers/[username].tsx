import type { PublicProfile } from "@viajeroshub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DetailSkeleton, ErrorState } from "@/components/content-state";
import { api } from "@/lib/api";
import { absoluteMediaUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n-context";

export default function PublicTravelerScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    await Promise.resolve();
    setError(null);
    try {
      setProfile(await api.getPublicProfile(username));
    } catch (caught) {
      console.warn("Public profile load failed", caught);
      setError(t("loadError"));
    }
  }, [t, username]);

  useEffect(() => {
    let active = true;
    if (!username) return;
    api
      .getPublicProfile(username)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((caught) => {
        console.warn("Public profile load failed", caught);
        if (active) setError(t("loadError"));
      });
    return () => {
      active = false;
    };
  }, [t, username]);

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
          {profile ? `@${profile.username}` : "Perfil"}
        </Text>
      </View>

      {!profile && !error ? <DetailSkeleton /> : null}

      {error ? (
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title={t("loadError")}
            retryLabel={t("retry")}
            onRetry={() => void loadProfile()}
          />
        </View>
      ) : null}

      {profile ? (
        <ScrollView contentContainerClassName="px-5 py-8">
          <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <View className="h-28 bg-brand-500" />
            <View className="items-center px-6 pb-8">
              <View className="-mt-16 h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-50">
                {absoluteMediaUrl(profile.image) ? (
                  <Image
                    source={{ uri: absoluteMediaUrl(profile.image)! }}
                    className="h-full w-full"
                  />
                ) : (
                  <Text className="text-brand-700 text-4xl font-extrabold">
                    {(profile.name ?? profile.username)[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              <Text className="mt-5 text-center text-3xl font-extrabold text-slate-950">
                {profile.name ?? `@${profile.username}`}
              </Text>
              <Text className="text-brand-700 mt-1 font-bold">
                @{profile.username}
              </Text>
              {profile.instagramUrl ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(profile.instagramUrl!)}
                  className="mt-7 min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 active:opacity-60"
                >
                  <Text className="font-bold text-slate-700">
                    {t("viewInstagram")}
                  </Text>
                </Pressable>
              ) : (
                <View className="mt-7 min-h-12 items-center justify-center rounded-xl bg-slate-100 px-5">
                  <Text className="text-sm font-semibold text-slate-500">
                    {t("noPublicInstagram")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
