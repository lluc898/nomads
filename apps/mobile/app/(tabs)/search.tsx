import type { TravelLocation } from "@viajeroshub/shared";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPicker } from "@/components/location-picker";

export default function SearchScreen() {
  const [origin, setOrigin] = useState<TravelLocation | null>(null);
  const [destination, setDestination] = useState<TravelLocation | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-5 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="pb-6 pt-3">
          <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
            Explora el mundo
          </Text>
          <Text className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Buscar viajes
          </Text>
          <Text className="mt-2 leading-6 text-slate-600">
            Elige un país completo, un aeropuerto concreto o déjate sorprender.
          </Text>
        </View>

        <View className="gap-5 rounded-3xl border border-slate-200 bg-white p-5">
          <LocationPicker
            label="Desde"
            placeholder="País, ciudad, IATA o aeropuerto"
            value={origin}
            onChange={(location) => {
              setOrigin(location);
              setSubmitted(false);
            }}
          />
          <LocationPicker
            label="Hacia"
            placeholder="Cualquier lugar"
            includeAnywhere
            value={destination}
            onChange={(location) => {
              setDestination(location);
              setSubmitted(false);
            }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!origin || !destination}
          onPress={() => setSubmitted(true)}
          className="mt-5 h-14 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-40"
        >
          <Text className="text-base font-bold text-white">Buscar viajes</Text>
        </Pressable>

        {submitted ? (
          <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="text-lg font-extrabold text-slate-950">
              No hay viajes publicados todavía
            </Text>
            <Text className="mt-2 leading-6 text-slate-600">
              La búsqueda está lista. Cuando haya viajes entre estas ubicaciones
              aparecerán aquí.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
