import { Feather } from "@expo/vector-icons";
import type {
  TravelLocation,
  TripDateSelection,
  TripLinkInput,
} from "@viajeroshub/shared";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
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
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [step, setStep] = useState(0);
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
  const titles = [
    t("routeAndDates"),
    t("tripDetails"),
    t("bookingLinks"),
    t("privacy"),
    t("reviewAndPublish"),
  ];

  function go(next: number) {
    setError(null);
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function advance() {
    if (
      step === 0 &&
      (!origin || !destination || !dates || dates.dateMode !== "exact")
    ) {
      setError(t("routeRequired"));
      return;
    }
    if (
      step === 2 &&
      links.some((link) => !link.name.trim() || !/^https:\/\//i.test(link.url))
    ) {
      setError(t("linkRequired"));
      return;
    }
    go(Math.min(4, step + 1));
  }

  async function submit() {
    if (
      pending ||
      !origin ||
      !destination ||
      !dates ||
      dates.dateMode !== "exact"
    )
      return;
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
        links: links.map(({ name, type, url }) => ({ name, type, url })),
      });
      router.replace("/(tabs)/trips");
    } catch (caught) {
      console.warn("Trip publication failed", caught);
      setError(t("loadError"));
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
          ref={scrollRef}
          contentContainerClassName="px-5 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="pt-3 text-xs font-bold uppercase tracking-widest text-brand-600">
            {t("navCreate")}
          </Text>
          <Text className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            {t("createTrip")}
          </Text>
          <View
            accessible
            accessibilityRole="header"
            accessibilityLabel={`${t("stepOfTotal", { current: step + 1, total: 5 })}. ${titles[step]}`}
            className="mt-5 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-bold text-brand-600">
                  {t("stepOfTotal", { current: step + 1, total: 5 })}
                </Text>
                <Text className="mt-1 text-xl font-extrabold text-slate-950">
                  {titles[step]}
                </Text>
              </View>
              <Text className="font-bold text-slate-500">
                {Math.round(((step + 1) / 5) * 100)}%
              </Text>
            </View>
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${((step + 1) / 5) * 100}%` }}
              />
            </View>
          </View>

          {step === 0 ? (
            <View className="mt-4 gap-5 rounded-3xl border border-slate-200 bg-white p-5">
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
              <TravelDatePicker
                exactOnly
                initialValue={dates}
                onChange={setDates}
              />
            </View>
          ) : null}

          {step === 1 ? (
            <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
              <FieldLabel text={t("description")} />
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
              <FieldLabel text={t("budgetOptional")} />
              <TextInput
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="EUR"
                placeholderTextColor="#94A3B8"
                className="mt-2 h-14 rounded-xl border border-slate-300 px-4 text-base text-slate-950"
              />
              <FieldLabel text={t("groupSizeOptional")} />
              <TextInput
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="number-pad"
                placeholder="2-50"
                placeholderTextColor="#94A3B8"
                className="mt-2 h-14 rounded-xl border border-slate-300 px-4 text-base text-slate-950"
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
              <Text className="text-sm leading-5 text-slate-600">
                {t("bookingLinksHelp")}
              </Text>
              {links.map((link) => (
                <View
                  key={link.key}
                  className="mt-4 rounded-2xl bg-slate-50 p-4"
                >
                  <TextInput
                    value={link.name}
                    onChangeText={(name) => updateLink(link.key, { name })}
                    placeholder={t("linkName")}
                    placeholderTextColor="#94A3B8"
                    className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-slate-950"
                  />
                  <SegmentedRadio
                    label={t("bookingLinks")}
                    value={link.type}
                    options={["flight", "accommodation"]}
                    onChange={(type) => updateLink(link.key, { type })}
                  />
                  <TextInput
                    value={link.url}
                    onChangeText={(url) => updateLink(link.key, { url })}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    placeholder={t("linkUrl")}
                    placeholderTextColor="#94A3B8"
                    className="mt-3 h-14 rounded-xl border border-slate-300 bg-white px-4 text-slate-950"
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setLinks((current) =>
                        current.filter((item) => item.key !== link.key),
                      )
                    }
                    className="mt-2 min-h-11 justify-center self-start"
                  >
                    <Text className="font-bold text-red-600">
                      {t("remove")}
                    </Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
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
                className="mt-4 min-h-12 items-center justify-center rounded-xl border border-blue-200 active:bg-brand-50 disabled:opacity-50"
              >
                <Text className="font-bold text-brand-600">
                  + {t("addLink")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === 3 ? (
            <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
              <SegmentedRadio
                label={t("privacy")}
                value={visibility}
                options={["public", "private"]}
                onChange={setVisibility}
              />
            </View>
          ) : null}

          {step === 4 ? (
            <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
              <Text className="leading-6 text-slate-600">
                {t("reviewSummary")}
              </Text>
              <ReviewRow
                label={t("routeAndDates")}
                value={`${origin?.name ?? "-"} → ${destination?.name ?? "-"}\n${dates?.dateMode === "exact" ? `${dates.departureDate} - ${dates.returnDate}` : "-"}`}
                onEdit={() => go(0)}
              />
              <ReviewRow
                label={t("tripDetails")}
                value={
                  [description, budget ? `${budget} EUR` : "", maxParticipants]
                    .filter(Boolean)
                    .join(" · ") || "-"
                }
                onEdit={() => go(1)}
              />
              <ReviewRow
                label={t("bookingLinks")}
                value={
                  links.length ? links.map((link) => link.name).join(", ") : "-"
                }
                onEdit={() => go(2)}
              />
              <ReviewRow
                label={t("privacy")}
                value={t(visibility)}
                onEdit={() => go(3)}
              />
            </View>
          ) : null}

          {error ? (
            <Text
              accessibilityRole="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {error}
            </Text>
          ) : null}
          <View className="mt-5 flex-row gap-3">
            {step > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={pending}
                onPress={() => go(step - 1)}
                className="min-h-14 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white"
              >
                <Text className="font-bold text-slate-700">{t("back")}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={step === 4 ? submit : advance}
              className="min-h-14 flex-[2] items-center justify-center rounded-xl bg-brand-500 px-4 active:bg-brand-600 disabled:opacity-50"
            >
              {pending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">
                  {step === 4 ? t("publishTrip") : t("next")}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text className="mt-5 text-sm font-bold text-slate-800">{text}</Text>;
}

function SegmentedRadio<
  T extends "public" | "private" | "flight" | "accommodation",
>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const { t } = useI18n();
  return (
    <View
      accessible={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="mt-4"
    >
      <Text className="mb-2 text-sm font-bold text-slate-800">{label}</Text>
      <View className="flex-row rounded-xl bg-slate-100 p-1">
        {options.map((option) => {
          const checked = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              accessibilityLabel={`${label}, ${t(option)}`}
              onPress={() => onChange(option)}
              className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border-2 ${checked ? "border-brand-500 bg-white" : "border-transparent"}`}
            >
              <Feather
                name={checked ? "check-circle" : "circle"}
                size={18}
                color={checked ? "#0857C9" : "#64748B"}
              />
              <Text
                className={`font-bold ${checked ? "text-brand-600" : "text-slate-600"}`}
              >
                {t(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  const { t } = useI18n();
  return (
    <View className="mt-5 flex-row items-start gap-3 border-t border-slate-100 pt-5">
      <View className="flex-1">
        <Text className="text-sm font-bold text-slate-500">{label}</Text>
        <Text className="mt-1 font-semibold text-slate-900">{value}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        className="min-h-11 justify-center rounded-xl px-3"
      >
        <Text className="font-bold text-brand-600">{t("edit")}</Text>
      </Pressable>
    </View>
  );
}
