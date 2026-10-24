import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { completeSignIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (!code || exchangeStarted.current) return;
    exchangeStarted.current = true;
    const callbackUrl = `viajeroshub://auth/callback?code=${encodeURIComponent(code)}`;
    completeSignIn(callbackUrl).catch((caughtError: unknown) => {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No hemos podido completar el acceso.",
      );
    });
  }, [code, completeSignIn]);

  if (!code)
    return (
      <CallbackError
        message="No hemos recibido un código de acceso."
        onRetry={() => router.replace("/acceso")}
      />
    );
  if (!error) return <LoadingScreen />;
  return (
    <CallbackError message={error} onRetry={() => router.replace("/acceso")} />
  );
}

function CallbackError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-6">
      <View className="w-full rounded-2xl bg-white p-6">
        <Text className="text-xl font-bold text-slate-950">
          No hemos podido acceder
        </Text>
        <Text className="mt-2 leading-6 text-slate-600">{message}</Text>
        <Pressable
          onPress={onRetry}
          className="mt-5 h-12 items-center justify-center rounded-xl bg-brand-500"
        >
          <Text className="font-bold text-white">Volver a intentarlo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
