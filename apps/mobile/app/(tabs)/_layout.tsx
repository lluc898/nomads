import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";

const TabIcon = ({ symbol, color }: { symbol: string; color: ColorValue }) => (
  <Text style={{ color, fontSize: 19 }}>{symbol}</Text>
);

export default function TabsLayout() {
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
          title: "Explorar",
          tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color }) => <TabIcon symbol="⌕" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Crear",
          tabBarIcon: ({ color }) => <TabIcon symbol="＋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Mis viajes",
          tabBarIcon: ({ color }) => <TabIcon symbol="✈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <TabIcon symbol="●" color={color} />,
        }}
      />
    </Tabs>
  );
}
