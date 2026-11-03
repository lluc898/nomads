import type {
  CreateTripInput,
  MobileProfile,
  SupportedLocale,
} from "@viajeroshub/shared";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api";
import { WEB_URL } from "@/lib/config";
import { PUSH_TOKEN_KEY } from "@/lib/push-constants";

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = "viajeroshub.mobile-session";
const PENDING_VERIFIER_KEY = "viajeroshub.pkce-verifier";
type AuthContextValue = {
  status: "loading" | "signedOut" | "signedIn";
  profile: MobileProfile | null;
  signIn: () => Promise<void>;
  completeSignIn: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (formData: FormData) => Promise<MobileProfile>;
  refreshProfile: () => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<void>;
  listMyTrips: (locale?: SupportedLocale) => ReturnType<typeof api.listMyTrips>;
  getTrip: (
    slug: string,
    locale?: SupportedLocale,
  ) => ReturnType<typeof api.getTrip>;
  getTripChat: (slug: string) => ReturnType<typeof api.getTripChat>;
  listTripConversations: () => ReturnType<typeof api.listTripConversations>;
  sendTripMessage: (
    slug: string,
    content: string,
  ) => ReturnType<typeof api.sendTripMessage>;
  subscribeTripChat: (
    slug: string,
    onMessages: () => void,
    signal: AbortSignal,
  ) => ReturnType<typeof api.subscribeTripChat>;
  joinTrip: (slug: string) => ReturnType<typeof api.joinTrip>;
  closeTrip: (slug: string) => ReturnType<typeof api.closeTrip>;
  leaveTrip: (slug: string) => ReturnType<typeof api.leaveTrip>;
  reviewTripJoinRequest: (
    slug: string,
    requestId: string,
    action: "accept" | "reject",
  ) => ReturnType<typeof api.reviewTripJoinRequest>;
  listNotifications: () => ReturnType<typeof api.listNotifications>;
  markNotificationRead: (
    input: { notificationId: string } | { all: true },
  ) => ReturnType<typeof api.markNotificationRead>;
  subscribeNotifications: (
    onNotifications: () => void,
    signal: AbortSignal,
  ) => ReturnType<typeof api.subscribeNotifications>;
  registerPushToken: (
    pushToken: string,
    platform: "ios" | "android",
    locale: SupportedLocale,
  ) => ReturnType<typeof api.registerPushToken>;
  getTripNotificationPreferences: (
    slug: string,
  ) => ReturnType<typeof api.getTripNotificationPreferences>;
  setTripNotificationPreferences: (
    slug: string,
    chatMuted: boolean,
  ) => ReturnType<typeof api.setTripNotificationPreferences>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const exchangeRef = useRef<{ code: string; promise: Promise<void> } | null>(
    null,
  );
  const completedCodeRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (sessionToken: string) => {
    try {
      const nextProfile = await api.getMobileProfile(sessionToken);
      setToken(sessionToken);
      setProfile(nextProfile);
      setStatus("signedIn");
    } catch (error) {
      if (hasStatus(error, 401)) {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        setToken(null);
        setProfile(null);
        setStatus("signedOut");
        return;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((storedToken) => {
        if (!storedToken) {
          setStatus("signedOut");
          return;
        }
        return loadProfile(storedToken);
      })
      .catch(() => setStatus("signedOut"));
  }, [loadProfile]);

  const completeSignIn = useCallback(
    async (url: string) => {
      const code = new URL(url).searchParams.get("code");
      if (!code) throw new Error("Google no ha devuelto un acceso válido.");
      if (completedCodeRef.current === code) return;
      if (exchangeRef.current?.code === code)
        return exchangeRef.current.promise;

      const promise = (async () => {
        const verifier = await SecureStore.getItemAsync(PENDING_VERIFIER_KEY);
        if (!verifier)
          throw new Error("La solicitud de acceso ya no está disponible.");
        const nextToken = await api.exchangeMobileCode(code, verifier);
        await SecureStore.setItemAsync(SESSION_KEY, nextToken);
        await SecureStore.deleteItemAsync(PENDING_VERIFIER_KEY);
        completedCodeRef.current = code;
        await loadProfile(nextToken);
      })();
      exchangeRef.current = { code, promise };
      try {
        await promise;
      } finally {
        if (exchangeRef.current?.code === code) exchangeRef.current = null;
      }
    },
    [loadProfile],
  );

  const signIn = useCallback(async () => {
    const verifier = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replaceAll(
      "-",
      "",
    );
    const challenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
    );
    const returnTo = Linking.createURL("auth/callback");
    const accessUrl = new URL("/movil/acceso", WEB_URL);
    accessUrl.searchParams.set("returnTo", returnTo);
    accessUrl.searchParams.set("challenge", challenge);
    await SecureStore.setItemAsync(PENDING_VERIFIER_KEY, verifier);

    const result = await WebBrowser.openAuthSessionAsync(
      accessUrl.toString(),
      returnTo,
    );
    if (result.type !== "success") {
      await SecureStore.deleteItemAsync(PENDING_VERIFIER_KEY);
      return;
    }
    await completeSignIn(result.url);
  }, [completeSignIn]);

  const signOut = useCallback(async () => {
    const currentToken = token;
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    setToken(null);
    setProfile(null);
    setStatus("signedOut");
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    if (currentToken && pushToken)
      await api.removePushToken(currentToken, pushToken).catch(() => undefined);
    if (currentToken)
      await api.logoutMobile(currentToken).catch(() => undefined);
  }, [token]);

  const saveProfile = useCallback(
    async (formData: FormData) => {
      if (!token) throw new Error("Tu sesión ha caducado.");
      const nextProfile = await api.updateMobileProfile(token, formData);
      setProfile(nextProfile);
      return nextProfile;
    },
    [token],
  );

  const refreshProfile = useCallback(async () => {
    if (token) await loadProfile(token);
  }, [loadProfile, token]);

  const createTrip = useCallback(
    async (input: CreateTripInput) => {
      if (!token) throw new Error("Tu sesión ha caducado.");
      await api.createTrip(token, input);
    },
    [token],
  );

  const listMyTrips = useCallback(
    (locale?: SupportedLocale) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.listMyTrips(token, locale);
    },
    [token],
  );

  const getTrip = useCallback(
    (slug: string, locale?: SupportedLocale) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.getTrip(token, slug, locale);
    },
    [token],
  );

  const joinTrip = useCallback(
    (slug: string) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.joinTrip(token, slug);
    },
    [token],
  );

  const closeTrip = useCallback(
    (slug: string) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.closeTrip(token, slug);
    },
    [token],
  );

  const leaveTrip = useCallback(
    (slug: string) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.leaveTrip(token, slug);
    },
    [token],
  );

  const getTripChat = useCallback(
    (slug: string) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.getTripChat(token, slug);
    },
    [token],
  );

  const listTripConversations = useCallback(() => {
    if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
    return api.listTripConversations(token);
  }, [token]);

  const sendTripMessage = useCallback(
    (slug: string, content: string) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.sendTripMessage(token, slug, content);
    },
    [token],
  );

  const subscribeTripChat = useCallback(
    (slug: string, onMessages: () => void, signal: AbortSignal) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.subscribeTripChat(token, slug, onMessages, signal);
    },
    [token],
  );

  const reviewTripJoinRequest = useCallback(
    (slug: string, requestId: string, action: "accept" | "reject") => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.reviewTripJoinRequest(token, slug, requestId, { action });
    },
    [token],
  );

  const listNotifications = useCallback(() => {
    if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
    return api.listNotifications(token);
  }, [token]);

  const markNotificationRead = useCallback(
    (input: { notificationId: string } | { all: true }) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.markNotificationRead(token, input);
    },
    [token],
  );

  const subscribeNotifications = useCallback(
    (onNotifications: () => void, signal: AbortSignal) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.subscribeNotifications(token, onNotifications, signal);
    },
    [token],
  );

  const registerPushToken = useCallback(
    (
      pushToken: string,
      platform: "ios" | "android",
      locale: SupportedLocale,
    ) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.registerPushToken(token, {
        token: pushToken,
        platform,
        locale,
      });
    },
    [token],
  );

  const getTripNotificationPreferences = useCallback(
    (slug: string) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.getTripNotificationPreferences(token, slug);
    },
    [token],
  );

  const setTripNotificationPreferences = useCallback(
    (slug: string, chatMuted: boolean) => {
      if (!token) return Promise.reject(new Error("Tu sesión ha caducado."));
      return api.setTripNotificationPreferences(token, slug, { chatMuted });
    },
    [token],
  );

  const value = useMemo(
    () => ({
      status,
      profile,
      signIn,
      completeSignIn,
      signOut,
      saveProfile,
      refreshProfile,
      createTrip,
      listMyTrips,
      getTrip,
      getTripChat,
      listTripConversations,
      sendTripMessage,
      subscribeTripChat,
      joinTrip,
      closeTrip,
      leaveTrip,
      reviewTripJoinRequest,
      listNotifications,
      markNotificationRead,
      subscribeNotifications,
      registerPushToken,
      getTripNotificationPreferences,
      setTripNotificationPreferences,
    }),
    [
      completeSignIn,
      profile,
      refreshProfile,
      saveProfile,
      signIn,
      signOut,
      status,
      createTrip,
      listMyTrips,
      getTrip,
      getTripChat,
      listTripConversations,
      sendTripMessage,
      subscribeTripChat,
      joinTrip,
      closeTrip,
      leaveTrip,
      reviewTripJoinRequest,
      listNotifications,
      markNotificationRead,
      subscribeNotifications,
      registerPushToken,
      getTripNotificationPreferences,
      setTripNotificationPreferences,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return value;
}

function hasStatus(error: unknown, status: number) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === status
  );
}
