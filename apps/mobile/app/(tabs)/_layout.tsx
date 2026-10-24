import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";

import { useI18n } from "@/lib/i18n-context";

const TabIcon = ({ symbol, color }: { symbol: string; color: ColorValue }) => (
  <Text style={{ color, fontSize: 19 }}>{symbol}</Text>
);

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B6EFD",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 20,
          borderTopColor: "#E2E8F0",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navHome"),
          tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t("navCreate"),
          tabBarIcon: ({ color }) => <TabIcon symbol="＋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: t("navMyTrips"),
          tabBarIcon: ({ color }) => <TabIcon symbol="✈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navProfile"),
          tabBarIcon: ({ color }) => <TabIcon symbol="●" color={color} />,
        }}
      />
    </Tabs>
  );
}
