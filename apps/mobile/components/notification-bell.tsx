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
      <Text className="text-xl text-slate-800">🔔</Text>
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
