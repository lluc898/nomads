import { createApiClient } from "@viajeroshub/api-client";
import type { MobileProfile } from "@viajeroshub/shared";
import * as Crypto from "expo-crypto";
import { fetch as expoFetch } from "expo/fetch";
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

import { API_URL, WEB_URL } from "@/lib/config";

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = "viajeroshub.mobile-session";
const PENDING_VERIFIER_KEY = "viajeroshub.pkce-verifier";
const api = createApiClient({
  baseUrl: API_URL,
  fetcher: expoFetch as typeof fetch,
});

type AuthContextValue = {
  status: "loading" | "signedOut" | "signedIn";
  profile: MobileProfile | null;
  signIn: () => Promise<void>;
  completeSignIn: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (formData: FormData) => Promise<MobileProfile>;
  refreshProfile: () => Promise<void>;
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
    setToken(null);
    setProfile(null);
    setStatus("signedOut");
    await SecureStore.deleteItemAsync(SESSION_KEY);
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

  const value = useMemo(
    () => ({
      status,
      profile,
      signIn,
      completeSignIn,
      signOut,
      saveProfile,
      refreshProfile,
    }),
    [
      completeSignIn,
      profile,
      refreshProfile,
      saveProfile,
      signIn,
      signOut,
      status,
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
