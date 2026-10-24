import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";

export default function AccessScreen() {
  const { signIn } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setPending(true);
    setError(null);
    try {
      await signIn();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No hemos podido iniciar sesión.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 justify-between bg-slate-50 px-6 pb-8 pt-10">
      <View>
        <Text className="text-2xl font-extrabold tracking-tight text-slate-950">
          Viajeros<Text className="text-brand-500">Hub</Text>
        </Text>
        <View className="mt-14 h-16 w-16 items-center justify-center rounded-2xl bg-brand-500">
          <Text className="text-3xl text-white">✦</Text>
        </View>
        <Text className="mt-7 text-4xl font-extrabold leading-[44px] tracking-tight text-slate-950">
          Tu próxima historia empieza aquí
        </Text>
        <Text className="mt-4 text-base leading-6 text-slate-600">
          Encuentra compañeros, crea planes y organiza tus viajes en grupo desde
          el móvil.
        </Text>
      </View>

      <View>
        {error ? (
          <Text
            accessibilityRole="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={handleSignIn}
          className="h-14 flex-row items-center justify-center rounded-xl border border-slate-300 bg-white active:bg-slate-100 disabled:opacity-60"
        >
          {pending ? (
            <ActivityIndicator color="#0B6EFD" />
          ) : (
            <Text className="text-base font-bold text-slate-900">
              Continuar con Google
            </Text>
          )}
        </Pressable>
        <Text className="mt-4 text-center text-xs leading-5 text-slate-500">
          Al continuar aceptas las condiciones de uso y la política de
          privacidad.
        </Text>
      </View>
    </SafeAreaView>
  );
}
