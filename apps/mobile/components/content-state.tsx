import { Pressable, Text, View } from "react-native";

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className="gap-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <View className="h-32 bg-slate-200" />
          <View className="gap-3 p-4">
            <View className="h-5 w-2/3 rounded-full bg-slate-200" />
            <View className="h-4 w-full rounded-full bg-slate-100" />
            <View className="h-4 w-1/2 rounded-full bg-slate-100" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className="flex-row gap-3 border-b border-slate-100 p-4"
        >
          <View className="h-12 w-12 rounded-2xl bg-slate-200" />
          <View className="flex-1 gap-2 py-1">
            <View className="h-4 w-2/3 rounded-full bg-slate-200" />
            <View className="h-3 w-full rounded-full bg-slate-100" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DetailSkeleton() {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className="gap-4 px-5 py-6"
    >
      <View className="h-56 rounded-3xl bg-slate-200" />
      <View className="h-7 w-3/4 rounded-full bg-slate-200" />
      <View className="h-4 rounded-full bg-slate-100" />
      <View className="h-4 w-5/6 rounded-full bg-slate-100" />
      <View className="h-36 rounded-3xl bg-slate-100" />
    </View>
  );
}

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message?: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      className="rounded-2xl border border-red-200 bg-white p-5"
    >
      <Text className="text-lg font-extrabold text-slate-950">{title}</Text>
      {message ? (
        <Text className="mt-2 leading-6 text-slate-600">{message}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="mt-4 min-h-12 items-center justify-center rounded-xl bg-brand-500 px-5"
      >
        <Text className="font-bold text-white">{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actions,
}: {
  title: string;
  message: string;
  actions: { label: string; onPress: () => void }[];
}) {
  return (
    <View className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
      <Text className="text-center text-xl font-extrabold text-slate-950">
        {title}
      </Text>
      <Text className="mt-2 text-center leading-6 text-slate-600">
        {message}
      </Text>
      <View className="mt-5 gap-3">
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            onPress={action.onPress}
            className={`min-h-12 items-center justify-center rounded-xl px-5 ${index === 0 ? "bg-brand-500" : "border border-blue-200 bg-brand-50"}`}
          >
            <Text
              className={`font-bold ${index === 0 ? "text-white" : "text-brand-600"}`}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
