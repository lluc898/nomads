import type { TravelLocation } from "@viajeroshub/shared";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/lib/api";

type LocationPickerProps = {
  label: string;
  placeholder: string;
  includeAnywhere?: boolean;
  value: TravelLocation | null;
  onChange: (location: TravelLocation | null) => void;
};

export function LocationPicker({
  label,
  placeholder,
  includeAnywhere = false,
  value,
  onChange,
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TravelLocation[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    if (!focused || value || (!query.trim() && !includeAnywhere)) return;
    const currentRequest = ++requestId.current;
    const timeout = setTimeout(() => {
      api
        .searchLocations(query, { includeAnywhere })
        .then((locations) => {
          if (requestId.current === currentRequest) setResults(locations);
        })
        .catch(() => {
          if (requestId.current === currentRequest) setResults([]);
        })
        .finally(() => {
          if (requestId.current === currentRequest) setLoading(false);
        });
    }, 220);
    return () => clearTimeout(timeout);
  }, [focused, includeAnywhere, query, value]);

  if (value) {
    return (
      <View>
        <Text className="text-sm font-bold text-slate-800">{label}</Text>
        <Pressable
          onPress={() => {
            onChange(null);
            setQuery("");
            setFocused(true);
          }}
          className="mt-2 flex-row items-center rounded-xl border border-blue-200 bg-brand-50 p-4"
        >
          <Text className="mr-3 text-xl">
            {value.kind === "airport"
              ? "✈"
              : value.kind === "country"
                ? "◎"
                : "✦"}
          </Text>
          <View className="min-w-0 flex-1">
            <Text className="font-bold text-slate-950">{value.name}</Text>
            <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
              {value.subtitle}
            </Text>
          </View>
          <Text className="ml-2 font-bold text-brand-600">Cambiar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-sm font-bold text-slate-800">{label}</Text>
      <View className="mt-2 flex-row items-center rounded-xl border border-slate-300 bg-white px-4">
        <Text className="mr-2 text-lg text-brand-500">⌕</Text>
        <TextInput
          value={query}
          onFocus={() => {
            setFocused(true);
            setLoading(Boolean(query.trim() || includeAnywhere));
          }}
          onChangeText={(text) => {
            setQuery(text);
            setFocused(true);
            setLoading(Boolean(text.trim() || includeAnywhere));
          }}
          autoCapitalize="words"
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          className="h-14 flex-1 text-base text-slate-950"
        />
        {loading ? <ActivityIndicator color="#0B6EFD" /> : null}
      </View>

      {focused && (query.trim() || includeAnywhere) ? (
        <View className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!loading && !results.length ? (
            <Text className="p-4 text-sm text-slate-500">
              No hemos encontrado países ni aeropuertos.
            </Text>
          ) : (
            results.map((location) => (
              <Pressable
                key={location.id}
                onPress={() => {
                  onChange(location);
                  setFocused(false);
                  setResults([]);
                }}
                className="flex-row items-center border-b border-slate-100 p-3 active:bg-slate-50"
              >
                <Text className="mr-3 text-xl">
                  {location.kind === "airport"
                    ? "✈"
                    : location.kind === "country"
                      ? "◎"
                      : "✦"}
                </Text>
                <View className="min-w-0 flex-1">
                  <Text className="font-bold text-slate-900" numberOfLines={1}>
                    {location.name}
                  </Text>
                  <Text
                    className="mt-0.5 text-xs text-slate-500"
                    numberOfLines={1}
                  >
                    {location.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
