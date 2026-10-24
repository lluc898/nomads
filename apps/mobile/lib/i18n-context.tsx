import {
  isSupportedLocale,
  translate,
  type SupportedLocale,
  type TranslationKey,
} from "@viajeroshub/shared";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

const LOCALE_KEY = "viajeroshub.locale";

type I18nValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<SupportedLocale>("es");

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(LOCALE_KEY)
      .then(async (savedLocale) => {
        if (isSupportedLocale(savedLocale)) return savedLocale;
        return api.detectLocale().catch(() => "en" as const);
      })
      .then((detectedLocale) => {
        if (!active) return;
        updateLocale(detectedLocale);
        return SecureStore.setItemAsync(LOCALE_KEY, detectedLocale);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        updateLocale(nextLocale);
        void SecureStore.setItemAsync(LOCALE_KEY, nextLocale);
      },
      t: (key, values) => translate(locale, key, values),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
}
