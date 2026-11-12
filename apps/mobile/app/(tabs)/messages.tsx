import type { TripConversationSummary } from "@viajeroshub/shared";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationBell } from "@/components/notification-bell";
import {
  EmptyState,
  ErrorState,
  RowsSkeleton,
} from "@/components/content-state";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function MessagesScreen() {
  const router = useRouter();
  const { listTripConversations } = useAuth();
  const { locale, t } = useI18n();
  const [conversations, setConversations] = useState<TripConversationSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConversations(await listTripConversations());
    } catch (caught) {
      console.warn("Conversations load failed", caught);
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [listTripConversations, t]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const dates = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="flex-row items-center px-5 pb-3 pt-4">
        <View className="flex-1">
          <Text className="text-3xl font-extrabold text-slate-950">
            {t("messages")}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {t("messagesSubtitle")}
          </Text>
        </View>
        <NotificationBell />
      </View>
      {loading ? (
        <View className="px-5 py-4">
          <RowsSkeleton />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="grow px-5 py-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load().finally(() => setRefreshing(false));
              }}
            />
          }
        >
          {error ? (
            <ErrorState
              title={t("loadError")}
              retryLabel={t("retry")}
              onRetry={() => void load()}
            />
          ) : null}
          {!error && conversations.length ? (
            <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {conversations.map((conversation) => (
                <Pressable
                  key={conversation.tripSlug}
                  onPress={() =>
                    router.push(`/messages/${conversation.tripSlug}`)
                  }
                  className="flex-row items-center gap-3 border-b border-slate-100 p-4 active:bg-slate-50"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                    <View className="h-5 w-6 rounded-md border-[1.5px] border-brand-600" />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-extrabold text-slate-950"
                      numberOfLines={1}
                    >
                      {conversation.tripTitle}
                    </Text>
                    <Text
                      className="mt-1 text-sm text-slate-500"
                      numberOfLines={1}
                    >
                      {conversation.lastMessage
                        ? `${conversation.lastSenderName ?? t("aTraveler")}: ${conversation.lastMessage}`
                        : t("noMessages")}
                    </Text>
                  </View>
                  <View className="items-end gap-2">
                    {conversation.lastMessageAt ? (
                      <Text className="text-[11px] text-slate-400">
                        {dates.format(new Date(conversation.lastMessageAt))}
                      </Text>
                    ) : null}
                    {conversation.unreadCount ? (
                      <View className="min-w-6 items-center rounded-full bg-brand-500 px-1.5">
                        <Text className="text-xs font-bold leading-6 text-white">
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : !error ? (
            <EmptyState
              title={t("noConversations")}
              message={t("emptyMessagesHelp")}
              actions={[
                {
                  label: t("navExplore"),
                  onPress: () => router.push("/(tabs)"),
                },
                {
                  label: t("navMyTrips"),
                  onPress: () => router.push("/(tabs)/trips"),
                },
              ]}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
