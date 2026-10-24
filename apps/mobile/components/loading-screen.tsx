import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n-context";

export function LoadingScreen() {
  const { t } = useI18n();
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <ActivityIndicator color="#0B6EFD" />
      </View>
      <Text className="mt-4 font-semibold text-slate-600">
        {t("preparing")}
      </Text>
    </SafeAreaView>
  );
}
