import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { absoluteMediaUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n-context";
import { useNotifications } from "@/lib/notifications-context";

const icons = {
  index: "home",
  create: "plus-circle",
  trips: "briefcase",
  messages: "message-circle",
  profile: "user",
} as const;

export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  const avatar = absoluteMediaUrl(profile?.image ?? null);

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: "#F8FAFC",
      }}
    >
      <View
        className="flex-row items-center rounded-[28px] border border-slate-200 bg-white p-1.5"
        style={{
          minHeight: 58,
          shadowColor: "#0F172A",
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const descriptor = descriptors[route.key];
          const label = String(descriptor.options.title ?? route.name);
          const badge = route.name === "messages" ? unreadCount : 0;
          const onPress = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={
                badge
                  ? `${label}, ${t("unreadCount", { count: badge })}`
                  : label
              }
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() =>
                emitter.emit({ type: "tabLongPress", target: route.key })
              }
              className={`relative min-h-11 min-w-11 flex-row items-center justify-center gap-1.5 rounded-2xl px-2 ${
                focused ? "bg-brand-50" : "bg-transparent"
              }`}
              style={{ flex: focused ? 1.45 : 0.75 }}
            >
              {route.name === "profile" && avatar ? (
                <Image
                  source={{ uri: avatar }}
                  className={`h-6 w-6 rounded-full ${focused ? "border-2 border-brand-600" : ""}`}
                />
              ) : (
                <Feather
                  name={icons[route.name as keyof typeof icons] ?? "circle"}
                  size={21}
                  color={focused ? "#0857C9" : "#64748B"}
                />
              )}
              {focused ? (
                <Text
                  numberOfLines={1}
                  className="max-w-20 text-xs font-extrabold text-brand-600"
                >
                  {label}
                </Text>
              ) : null}
              {badge ? (
                <View
                  accessible={false}
                  className="absolute -right-1 -top-1 min-w-5 items-center rounded-full bg-red-600 px-1"
                >
                  <Text className="text-[10px] font-bold leading-5 text-white">
                    {badge > 99 ? "99+" : badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
