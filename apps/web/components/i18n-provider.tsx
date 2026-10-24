"use client";

import {
  translate,
  type SupportedLocale,
  type TranslationKey,
} from "@viajeroshub/shared";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type I18nContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: SupportedLocale;
  children: React.ReactNode;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  useEffect(() => {
    if (!document.cookie.includes("viajeroshub_locale=")) {
      document.cookie = `viajeroshub_locale=${initialLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  }, [initialLocale]);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        document.cookie = `viajeroshub_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
        document.documentElement.lang = nextLocale;
        updateLocale(nextLocale);
        window.location.reload();
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
