import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { LoadingScreen } from "@/components/loading-screen";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { status, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const area = segments[0];
    if (status === "signedOut" && area !== "acceso" && area !== "auth") {
      router.replace("/acceso");
      return;
    }
    if (
      status === "signedIn" &&
      !profile?.profileComplete &&
      area !== "perfil-configuracion"
    ) {
      router.replace("/perfil-configuracion");
      return;
    }
    if (
      status === "signedIn" &&
      profile?.profileComplete &&
      (area === "acceso" || area === "perfil-configuracion" || area === "auth")
    ) {
      router.replace("/(tabs)");
    }
  }, [profile?.profileComplete, router, segments, status]);

  if (status === "loading") return <LoadingScreen />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
