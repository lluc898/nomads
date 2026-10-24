import { PROFILE_PHOTO_MAX_BYTES, usernameSchema } from "@viajeroshub/shared";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { absoluteMediaUrl, API_URL } from "@/lib/config";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

export function ProfileEditor({ mandatory = false }: { mandatory?: boolean }) {
  const { profile, saveProfile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [instagram, setInstagram] = useState(profile?.instagramUrl ?? "");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [availability, setAvailability] = useState<Availability>("idle");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const usernameIsFixed = Boolean(profile?.username);
  const avatarUrl = photo?.uri ?? absoluteMediaUrl(profile?.image ?? null);

  useEffect(() => {
    if (usernameIsFixed) return;
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(
        `${API_URL}/usernames/${encodeURIComponent(parsed.data)}/availability`,
        {
          signal: controller.signal,
        },
      )
        .then(async (response) => {
          const payload = (await response.json()) as { available?: boolean };
          setAvailability(payload.available ? "available" : "taken");
        })
        .catch((error: unknown) => {
          if (!(error instanceof Error && error.name === "AbortError"))
            setAvailability("idle");
        });
    }, 450);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username, usernameIsFixed]);

  const initials = useMemo(() => {
    const source = profile?.name || username || "V";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [profile?.name, username]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso necesario",
        "Permite el acceso a tus fotos para elegir un avatar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) {
      if (asset.fileSize && asset.fileSize > PROFILE_PHOTO_MAX_BYTES) {
        setFieldErrors({ photo: ["La foto no puede superar los 5 MB."] });
        return;
      }
      setPhoto(asset);
      setFieldErrors((errors) => ({ ...errors, photo: [] }));
    }
  }

  async function submit() {
    setMessage(null);
    setFieldErrors({});
    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      setFieldErrors({
        username: parsedUsername.error.issues.map((issue) => issue.message),
      });
      return;
    }
    if (!usernameIsFixed && availability !== "available") {
      setFieldErrors({ username: ["Elige un nombre de usuario disponible."] });
      return;
    }
    if (!avatarUrl) {
      setFieldErrors({ photo: ["Selecciona una foto de perfil."] });
      return;
    }

    const formData = new FormData();
    formData.append("username", parsedUsername.data);
    formData.append("instagram", instagram);
    if (photo) {
      const selectedFile = new File(photo.uri);
      formData.append(
        "photo",
        selectedFile,
        photo.fileName ?? selectedFile.name,
      );
    }

    setPending(true);
    try {
      await saveProfile(formData);
      setPhoto(null);
      setMessage("Perfil actualizado.");
    } catch (error) {
      const apiErrors = getApiErrors(error);
      setFieldErrors(apiErrors);
      setMessage(
        error instanceof Error
          ? error.message
          : "No hemos podido guardar el perfil.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!profile) return null;

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
          <View className="pb-5 pt-3">
            <Text className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {mandatory ? "Primer paso" : "Tu cuenta"}
            </Text>
            <Text className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              {mandatory ? "Completa tu perfil" : "Edita tu perfil"}
            </Text>
            <Text className="mt-2 leading-6 text-slate-600">
              Tu foto y tu nombre ayudan a que otros viajeros sepan con quién
              compartirán el viaje.
            </Text>
          </View>

          <View className="items-center rounded-3xl border border-slate-200 bg-white p-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              onPress={pickPhoto}
              className="relative h-32 w-32"
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="h-32 w-32 rounded-full bg-slate-100"
                />
              ) : (
                <View className="h-32 w-32 items-center justify-center rounded-full bg-brand-50">
                  <Text className="text-3xl font-extrabold text-brand-600">
                    {initials}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-brand-500">
                <Text className="text-lg text-white">✎</Text>
              </View>
            </Pressable>
            <Text className="mt-3 text-sm font-semibold text-brand-600">
              Pulsa la foto para cambiarla
            </Text>
            <FieldError messages={fieldErrors.photo} />
          </View>

          <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
            <Text className="text-sm font-bold text-slate-800">
              Nombre de usuario
            </Text>
            <View className="mt-2 flex-row items-center rounded-xl border border-slate-300 bg-white px-4">
              <Text className="text-base text-slate-500">@</Text>
              <TextInput
                value={username}
                editable={!usernameIsFixed}
                onChangeText={(value) => {
                  const normalized = value.replace(/^@/, "").toLowerCase();
                  setUsername(normalized);
                  setAvailability(
                    usernameSchema.safeParse(normalized).success
                      ? "checking"
                      : normalized
                        ? "invalid"
                        : "idle",
                  );
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="tu_nombre"
                className="h-13 flex-1 text-base text-slate-950 disabled:text-slate-500"
              />
            </View>
            {usernameIsFixed ? (
              <Text className="mt-2 text-xs leading-5 text-slate-500">
                Este nombre es definitivo y no se puede cambiar.
              </Text>
            ) : (
              <AvailabilityMessage value={availability} />
            )}
            <FieldError messages={fieldErrors.username} />

            <Text className="mt-5 text-sm font-bold text-slate-800">
              Instagram (opcional)
            </Text>
            <TextInput
              value={instagram}
              onChangeText={setInstagram}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="@tu_usuario"
              placeholderTextColor="#94A3B8"
              className="h-13 mt-2 rounded-xl border border-slate-300 px-4 text-base text-slate-950"
            />
            <FieldError messages={fieldErrors.instagram} />
          </View>

          {message ? (
            <Text
              accessibilityRole="alert"
              className={`mt-4 rounded-xl p-3 text-sm ${Object.keys(fieldErrors).length ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
            >
              {message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={submit}
            disabled={pending || (!usernameIsFixed && availability === "taken")}
            className="mt-5 h-14 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-50"
          >
            {pending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-bold text-white">
                {mandatory ? "Guardar y continuar" : "Guardar cambios"}
              </Text>
            )}
          </Pressable>

          {!mandatory ? (
            <Pressable
              accessibilityRole="button"
              onPress={signOut}
              className="mt-3 h-12 items-center justify-center rounded-xl"
            >
              <Text className="font-bold text-red-600">Cerrar sesión</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AvailabilityMessage({ value }: { value: Availability }) {
  if (value === "idle")
    return (
      <Text className="mt-2 text-xs text-slate-500">
        Entre 3 y 24 caracteres; letras, números y guion bajo.
      </Text>
    );
  if (value === "checking")
    return (
      <Text className="mt-2 text-xs text-slate-500">
        Comprobando disponibilidad…
      </Text>
    );
  if (value === "available")
    return (
      <Text className="mt-2 text-xs font-semibold text-green-700">
        Nombre disponible.
      </Text>
    );
  if (value === "taken")
    return (
      <Text className="mt-2 text-xs font-semibold text-red-700">
        Ese nombre ya está ocupado.
      </Text>
    );
  return (
    <Text className="mt-2 text-xs text-red-700">
      Usa entre 3 y 24 letras minúsculas, números o guiones bajos.
    </Text>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <Text className="mt-2 text-xs text-red-700">{messages[0]}</Text>;
}

function getApiErrors(error: unknown): Record<string, string[]> {
  if (typeof error !== "object" || error === null || !("errors" in error))
    return {};
  const errors = error.errors;
  if (typeof errors !== "object" || errors === null) return {};
  return errors as Record<string, string[]>;
}
