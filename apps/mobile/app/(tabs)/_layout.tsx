import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/floating-tab-bar";
import { useI18n } from "@/lib/i18n-context";

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navHome"),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t("navCreate"),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: t("navMyTrips"),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t("messages"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navProfile"),
        }}
      />
    </Tabs>
  );
}
