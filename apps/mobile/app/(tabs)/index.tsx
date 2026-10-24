import { featuredTrips } from "@viajeroshub/shared";
import { Image, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TripCard } from "@/components/trip-card";
import { useAuth } from "@/lib/auth-context";
import { absoluteMediaUrl } from "@/lib/config";

export default function ExploreScreen() {
  const { profile } = useAuth();
  const avatarUrl = absoluteMediaUrl(profile?.image ?? null);
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-5 pt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-extrabold tracking-tight text-slate-950">
                Viajeros<Text className="text-brand-500">Hub</Text>
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                ¿Dónde empieza tu próxima historia?
              </Text>
            </View>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="h-11 w-11 rounded-full bg-slate-200"
              />
            ) : (
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-500">
                <Text className="font-bold text-white">
                  {profile?.name?.[0]?.toUpperCase() ?? "V"}
                </Text>
              </View>
            )}
          </View>
          <View className="mt-6 rounded-2xl bg-brand-500 p-5">
            <Text className="text-2xl font-extrabold leading-8 text-white">
              Encuentra tu próximo viaje en grupo
            </Text>
            <Text className="mt-2 leading-5 text-blue-100">
              Busca un destino o déjate sorprender.
            </Text>
            <View className="h-13 mt-5 flex-row items-center rounded-xl bg-white px-4">
              <Text className="mr-2 text-xl text-brand-500">⌕</Text>
              <TextInput
                placeholder="¿Adónde quieres ir?"
                placeholderTextColor="#94A3B8"
                className="h-13 flex-1 text-base text-slate-900"
              />
            </View>
          </View>
          <View className="mt-6 flex-row items-end justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
                Ideas para empezar
              </Text>
              <Text className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                Viajes destacados
              </Text>
            </View>
            <Text className="font-bold text-brand-600">Ver todos</Text>
          </View>
        </View>
        <View className="px-5">
          {featuredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
