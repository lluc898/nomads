import type {
  TravelLocation,
  TripDateSelection,
  TripLinkInput,
} from "@viajeroshub/shared";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPicker } from "@/components/location-picker";
import { TravelDatePicker } from "@/components/travel-date-picker";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

type EditableLink = TripLinkInput & { key: string };

export default function CreateScreen() {
  const { createTrip } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [origin, setOrigin] = useState<TravelLocation | null>(null);
  const [destination, setDestination] = useState<TravelLocation | null>(null);
  const [dates, setDates] = useState<TripDateSelection | null>(null);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [links, setLinks] = useState<EditableLink[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!origin || !destination || !dates || dates.dateMode !== "exact") {
      setError(t("chooseDepartureThenReturn"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await createTrip({
        origin: origin.id as `country:${string}` | `airport:${number}`,
        destination: destination.id as
          `country:${string}` | `airport:${number}`,
        departureDate: dates.departureDate,
        returnDate: dates.returnDate,
        description,
        visibility,
        budget: budget ? Number(budget.replace(",", ".")) : null,
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        links: links.map((link) => ({
          name: link.name,
          type: link.type,
          url: link.url,
        })),
      });
      router.replace("/(tabs)/trips");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
      setPending(false);
    }
  }

  function updateLink(key: string, patch: Partial<TripLinkInput>) {
    setLinks((current) =>
      current.map((link) => (link.key === key ? { ...link, ...patch } : link)),
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="px-5 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="pt-3 text-xs font-bold uppercase tracking-widest text-brand-600">
            {t("navCreate")}
          </Text>
          <Text className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            {t("createTrip")}
          </Text>
          <Text className="mt-2 leading-6 text-slate-600">
            {t("createIntro")}
          </Text>

          <View className="mt-6 gap-5 rounded-3xl border border-slate-200 bg-white p-5">
            <Text className="text-xl font-extrabold text-slate-950">
              {t("routeAndDates")}
            </Text>
            <LocationPicker
              label={t("from")}
              placeholder={t("countryAirport")}
              value={origin}
              onChange={setOrigin}
            />
            <LocationPicker
              label={t("to")}
              placeholder={t("countryAirport")}
              value={destination}
              onChange={setDestination}
            />
            <TravelDatePicker exactOnly onChange={setDates} />
          </View>

          <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
            <Text className="text-xl font-extrabold text-slate-950">
              {t("tripDetails")}
            </Text>
            <Text className="mt-5 text-sm font-bold text-slate-800">
              {t("description")}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={3000}
              placeholder={t("descriptionPlaceholder")}
              placeholderTextColor="#94A3B8"
              textAlignVertical="top"
              className="mt-2 min-h-32 rounded-xl border border-slate-300 p-4 text-base text-slate-950"
            />
            <Text className="mt-5 text-sm font-bold text-slate-800">
              {t("budgetOptional")}
            </Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              placeholder="EUR"
              placeholderTextColor="#94A3B8"
              className="h-13 mt-2 rounded-xl border border-slate-300 px-4 text-base text-slate-950"
            />
            <Text className="mt-5 text-sm font-bold text-slate-800">
              {t("groupSizeOptional")}
            </Text>
            <TextInput
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="number-pad"
              placeholder="2–50"
              placeholderTextColor="#94A3B8"
              className="h-13 mt-2 rounded-xl border border-slate-300 px-4 text-base text-slate-950"
            />
            <Text className="mt-5 text-sm font-bold text-slate-800">
              {t("privacy")}
            </Text>
            <View className="mt-2 flex-row rounded-xl bg-slate-100 p-1">
              {(["public", "private"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setVisibility(option)}
                  className={`h-12 flex-1 items-center justify-center rounded-lg ${visibility === option ? "bg-white" : ""}`}
                >
                  <Text
                    className={`font-bold ${visibility === option ? "text-brand-600" : "text-slate-600"}`}
                  >
                    {t(option)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
            <Text className="text-xl font-extrabold text-slate-950">
              {t("bookingLinks")}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-slate-600">
              {t("bookingLinksHelp")}
            </Text>
            {links.map((link) => (
              <View key={link.key} className="mt-4 rounded-2xl bg-slate-50 p-4">
                <TextInput
                  value={link.name}
                  onChangeText={(name) => updateLink(link.key, { name })}
                  placeholder={t("linkName")}
                  placeholderTextColor="#94A3B8"
                  className="h-13 rounded-xl border border-slate-300 bg-white px-4 text-slate-950"
                />
                <View className="mt-3 flex-row rounded-xl bg-slate-200 p-1">
                  {(["flight", "accommodation"] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => updateLink(link.key, { type })}
                      className={`h-11 flex-1 items-center justify-center rounded-lg ${link.type === type ? "bg-white" : ""}`}
                    >
                      <Text
                        className={`font-bold ${link.type === type ? "text-brand-600" : "text-slate-600"}`}
                      >
                        {t(type)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={link.url}
                  onChangeText={(url) => updateLink(link.key, { url })}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder={t("linkUrl")}
                  placeholderTextColor="#94A3B8"
                  className="h-13 mt-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-950"
                />
                <Pressable
                  onPress={() =>
                    setLinks((current) =>
                      current.filter((item) => item.key !== link.key),
                    )
                  }
                  className="mt-2 h-11 justify-center self-start"
                >
                  <Text className="font-bold text-red-600">{t("remove")}</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              disabled={links.length >= 20}
              onPress={() =>
                setLinks((current) => [
                  ...current,
                  {
                    key: String(Date.now()),
                    name: "",
                    type: "flight",
                    url: "",
                  },
                ])
              }
              className="mt-4 h-12 items-center justify-center rounded-xl border border-blue-200 active:bg-brand-50 disabled:opacity-50"
            >
              <Text className="font-bold text-brand-600">+ {t("addLink")}</Text>
            </Pressable>
          </View>

          {error ? (
            <Text
              accessibilityRole="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </Text>
          ) : null}
          <Pressable
            disabled={pending}
            onPress={submit}
            className="mt-5 h-14 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-50"
          >
            {pending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-bold text-white">
                {t("publishTrip")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
