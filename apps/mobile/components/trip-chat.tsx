import type { ChatMessage } from "@viajeroshub/shared";
import { CHAT_MESSAGE_MAX_LENGTH } from "@viajeroshub/shared";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useAuth } from "@/lib/auth-context";
import { absoluteMediaUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n-context";

export function TripChat({ slug }: { slug: string }) {
  const { getTripChat, sendTripMessage, subscribeTripChat } = useAuth();
  const { locale, t } = useI18n();
  const { height } = useWindowDimensions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(
    async (quiet = false) => {
      try {
        const result = await getTripChat(slug);
        setMessages(result.messages);
        setError(null);
      } catch (caught) {
        if (!quiet)
          setError(caught instanceof Error ? caught.message : "Error");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [getTripChat, slug],
  );

  useEffect(() => {
    let active = true;
    getTripChat(slug)
      .then((result) => {
        if (!active) return;
        setMessages(result.messages);
        setError(null);
      })
      .catch((caught) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "Error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const controller = new AbortController();
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      void subscribeTripChat(
        slug,
        () => void loadMessages(true),
        controller.signal,
      ).catch(() => {
        if (!controller.signal.aborted) reconnect = setTimeout(connect, 3_000);
      });
    };
    connect();
    return () => {
      active = false;
      controller.abort();
      if (reconnect) clearTimeout(reconnect);
    };
  }, [getTripChat, loadMessages, slug, subscribeTripChat]);

  async function submit() {
    const nextContent = content.trim();
    if (!nextContent || sending) return;
    setSending(true);
    setError(null);
    try {
      const message = await sendTripMessage(slug, nextContent);
      setMessages((current) => [...current, message]);
      setContent("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
    } finally {
      setSending(false);
    }
  }

  return (
    <View
      className="-mx-5 border-t border-slate-200 bg-white px-5 pb-5 pt-8"
      style={{ height: Math.max(height - 40, 600) }}
    >
      <Text className="text-2xl font-extrabold text-slate-950">
        {t("chat")}
      </Text>
      <Text className="mt-1 text-sm text-slate-500">{t("chatSubtitle")}</Text>
      <ScrollView
        nestedScrollEnabled
        className="mt-5 flex-1"
        contentContainerClassName="gap-4 py-2 grow"
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#0B6EFD" />
          </View>
        ) : messages.length ? (
          messages.map((message) => (
            <View
              key={message.id}
              className={`flex-row gap-2 ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              {!message.isOwn ? (
                absoluteMediaUrl(message.author.image) ? (
                  <Image
                    source={{ uri: absoluteMediaUrl(message.author.image)! }}
                    className="h-9 w-9 rounded-full bg-slate-200"
                  />
                ) : (
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                    <Text className="text-brand-700 text-xs font-bold">
                      {(message.author.name ??
                        message.author.username ??
                        "V")[0]?.toUpperCase()}
                    </Text>
                  </View>
                )
              ) : null}
              <View
                className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                  message.isOwn
                    ? "rounded-tr-sm bg-brand-500"
                    : "rounded-tl-sm border border-slate-200 bg-white"
                }`}
              >
                {!message.isOwn ? (
                  <Text className="text-brand-700 mb-1 text-xs font-bold">
                    {message.author.name ?? `@${message.author.username}`}
                  </Text>
                ) : null}
                <Text
                  className={message.isOwn ? "text-white" : "text-slate-800"}
                >
                  {message.content}
                </Text>
                <Text
                  className={`mt-1 text-right text-[11px] ${message.isOwn ? "text-blue-100" : "text-slate-400"}`}
                >
                  {new Intl.DateTimeFormat(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(message.createdAt))}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View className="flex-1 items-center justify-center px-5">
            <Text className="text-center text-sm text-slate-500">
              {t("noMessages")}
            </Text>
          </View>
        )}
      </ScrollView>
      {error ? (
        <Text className="mt-3 text-sm font-semibold text-red-700">{error}</Text>
      ) : null}
      <View className="mt-4 flex-row items-end gap-2">
        <TextInput
          value={content}
          onChangeText={setContent}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          multiline
          placeholder={t("messagePlaceholder")}
          className="max-h-28 min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("send")}
          disabled={!content.trim() || sending}
          onPress={submit}
          className="h-12 w-12 items-center justify-center rounded-full bg-brand-500 disabled:opacity-50"
        >
          <Text className="text-xl font-extrabold text-white">➤</Text>
        </Pressable>
      </View>
    </View>
  );
}
