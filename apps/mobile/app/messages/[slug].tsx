import { useLocalSearchParams, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TripChat } from "@/components/trip-chat";
import { useI18n } from "@/lib/i18n-context";

export default function GroupChatScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useI18n();
  if (!slug) return null;
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
        >
          <Text className="text-2xl text-slate-800">{"\u2190"}</Text>
        </Pressable>
        <Text className="ml-3 flex-1 text-lg font-extrabold text-slate-950">
          {t("chat")}
        </Text>
        <Pressable
          onPress={() => router.push(`/trips/${slug}`)}
          className="min-h-11 justify-center rounded-xl border border-slate-300 px-3"
        >
          <Text className="text-sm font-bold text-slate-800">
            {t("goToTrip")}
          </Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TripChat slug={slug} standalone />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
