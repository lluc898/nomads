import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function LoadingScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <ActivityIndicator color="#0B6EFD" />
      </View>
      <Text className="mt-4 font-semibold text-slate-600">
        Preparando tu viaje…
      </Text>
    </SafeAreaView>
  );
}
