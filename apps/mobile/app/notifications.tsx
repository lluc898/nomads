import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState, RowsSkeleton } from "@/components/content-state";
import { absoluteMediaUrl } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { notificationText } from "@/lib/notification-copy";
import { useNotifications } from "@/lib/notifications-context";

export default function NotificationsScreen() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { reviewTripJoinRequest } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function review(
    notificationId: string,
    slug: string,
    requestId: string,
    action: "accept" | "reject",
  ) {
    if (busy) return;
    setBusy(notificationId);
    try {
      await reviewTripJoinRequest(slug, requestId, action);
      setHandled((current) => new Set(current).add(notificationId));
      await markRead(notificationId);
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="flex-row items-center border-b border-slate-200 bg-white px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("back")}
          onPress={() => router.back()}
          className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-slate-100"
        >
          <Text className="text-2xl text-slate-800">‹</Text>
        </Pressable>
        <Text className="flex-1 text-2xl font-extrabold text-slate-950">
          {t("notifications")}
        </Text>
        {unreadCount ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void markAllRead()}
            className="min-h-11 justify-center px-2"
          >
            <Text className="text-sm font-bold text-brand-600">
              {t("markAllRead")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View className="px-5 py-5">
          <RowsSkeleton />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 py-5 grow"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor="#0B6EFD"
              onRefresh={() => {
                setRefreshing(true);
                void refresh()
                  .catch(() => undefined)
                  .finally(() => setRefreshing(false));
              }}
            />
          }
        >
          {error ? (
            <ErrorState
              title={t("loadError")}
              retryLabel={t("retry")}
              onRetry={() => void refresh().catch(() => undefined)}
            />
          ) : !notifications.length ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
                <Text className="text-3xl">🔔</Text>
              </View>
              <Text className="mt-5 text-center font-semibold text-slate-600">
                {t("noNotifications")}
              </Text>
              <Text className="mt-2 text-center leading-6 text-slate-500">
                {t("emptyNotificationsHelp")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                className="mt-5 min-h-12 items-center justify-center rounded-xl bg-brand-500 px-6"
              >
                <Text className="font-bold text-white">{t("back")}</Text>
              </Pressable>
            </View>
          ) : (
            <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {notifications.map((notification) => {
                const image = absoluteMediaUrl(notification.actorImage);
                return (
                  <View
                    key={notification.id}
                    className={`flex-row gap-3 border-b border-slate-100 p-4 active:bg-slate-100 ${
                      notification.isRead ? "bg-white" : "bg-brand-50"
                    }`}
                  >
                    <Pressable
                      disabled={!notification.actorUsername}
                      onPress={() =>
                        notification.actorUsername &&
                        router.push(`/travelers/${notification.actorUsername}`)
                      }
                    >
                      {image ? (
                        <Image
                          source={{ uri: image }}
                          className="h-11 w-11 rounded-full bg-slate-200"
                        />
                      ) : (
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
                          <Text className="font-bold text-brand-600">
                            {(notification.actorName ?? "V")[0]?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                    <View className="min-w-0 flex-1">
                      <Pressable
                        onPress={() => {
                          if (!notification.isRead)
                            void markRead(notification.id);
                          router.push(
                            notification.type === "chat_message"
                              ? `/messages/${notification.tripSlug}`
                              : `/trips/${notification.tripSlug}`,
                          );
                        }}
                      >
                        <Text className="font-bold leading-5 text-slate-950">
                          {notificationText(notification, t)}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(notification.createdAt))}
                        </Text>
                      </Pressable>
                      {notification.type === "join_request" &&
                      notification.requestId &&
                      !handled.has(notification.id) ? (
                        <View className="mt-3 flex-row gap-2">
                          <Pressable
                            disabled={busy === notification.id}
                            onPress={() =>
                              void review(
                                notification.id,
                                notification.tripSlug,
                                notification.requestId!,
                                "accept",
                              )
                            }
                            className="min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-500 disabled:opacity-50"
                          >
                            <Text className="font-bold text-white">
                              {t("accept")}
                            </Text>
                          </Pressable>
                          <Pressable
                            disabled={busy === notification.id}
                            onPress={() =>
                              void review(
                                notification.id,
                                notification.tripSlug,
                                notification.requestId!,
                                "reject",
                              )
                            }
                            className="min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 disabled:opacity-50"
                          >
                            <Text className="font-bold text-slate-700">
                              {t("reject")}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                    {!notification.isRead ? (
                      <View className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-500" />
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
