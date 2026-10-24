import { featuredTrips } from "@viajeroshub/shared";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeSearch } from "@/components/home-search";
import { TripCard } from "@/components/trip-card";
import { useAuth } from "@/lib/auth-context";
import { absoluteMediaUrl } from "@/lib/config";

export default function HomeScreen() {
  const { profile } = useAuth();
  const avatarUrl = absoluteMediaUrl(profile?.image ?? null);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-brand-50 px-5 pb-8 pt-3">
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

          <View className="pb-6 pt-8">
            <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Viajar juntos empieza aquí
            </Text>
            <Text className="mt-3 text-4xl font-extrabold leading-[44px] tracking-tight text-slate-950">
              Encuentra gente para tu{" "}
              <Text className="text-brand-500">próximo viaje</Text>
            </Text>
            <Text className="mt-3 text-base leading-6 text-slate-600">
              Descubre planes reales y conecta con viajeros afines.
            </Text>
          </View>

          <HomeSearch />
        </View>

        <View className="px-5 pb-5 pt-8">
          <View className="flex-row items-end justify-between">
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
