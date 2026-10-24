import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function PlaceholderScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
          <Text className="text-3xl text-brand-500">✦</Text>
        </View>
        <Text className="mt-5 text-2xl font-extrabold text-slate-950">
          {title}
        </Text>
        <Text className="mt-2 text-center leading-6 text-slate-500">
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}
