import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useI18n } from "@/lib/i18n-context";
import { useNotifications } from "@/lib/notifications-context";

export function NotificationBell() {
  const router = useRouter();
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("notifications")}
      onPress={() => router.push("/notifications")}
      className="relative h-11 w-11 items-center justify-center rounded-full bg-white active:bg-slate-100"
    >
      <View className="h-6 w-6 items-center justify-center">
        <View className="mt-0.5 h-4 w-4 rounded-t-full border-[1.5px] border-b-0 border-slate-700" />
        <View className="h-[1.5px] w-5 rounded-full bg-slate-700" />
        <View className="mt-1 h-1 w-1 rounded-full bg-slate-700" />
      </View>
      {unreadCount ? (
        <View className="absolute -right-1 -top-1 min-w-5 items-center rounded-full bg-red-600 px-1">
          <Text className="text-[11px] font-bold leading-5 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
