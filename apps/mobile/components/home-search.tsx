import type { TravelLocation, TripDateSelection } from "@viajeroshub/shared";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { LocationPicker } from "@/components/location-picker";
import { TravelDatePicker } from "@/components/travel-date-picker";

export function HomeSearch() {
  const [origin, setOrigin] = useState<TravelLocation | null>(null);
  const [destination, setDestination] = useState<TravelLocation | null>(null);
  const [dates, setDates] = useState<TripDateSelection | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <View>
      <View className="gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
        <TravelDatePicker
          onChange={(selection) => {
            setDates(selection);
            setSubmitted(false);
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar viajes"
          accessibilityState={{
            disabled: !origin || !destination || !dates,
          }}
          disabled={!origin || !destination || !dates}
          onPress={() => setSubmitted(true)}
          className="h-14 flex-row items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-40"
        >
          <Text className="mr-2 text-lg text-white">⌕</Text>
          <Text className="text-base font-bold text-white">Buscar viajes</Text>
        </Pressable>
      </View>

      {submitted ? (
        <View className="mt-4 rounded-2xl border border-blue-200 bg-white p-5">
          <Text className="text-lg font-extrabold text-slate-950">
            No hay viajes publicados para esta ruta
          </Text>
          <Text className="mt-2 leading-6 text-slate-600">
            Puedes ser la primera persona en publicar este viaje. Cuando haya
            planes compatibles aparecerán aquí.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
