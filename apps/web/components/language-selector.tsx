"use client";

import { supportedLocales } from "@viajeroshub/shared";

import { useI18n } from "./i18n-provider";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className={compact ? "sr-only" : "hidden lg:inline"}>
        {t("language")}
      </span>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-bold text-slate-700 outline-none focus:border-[#0B6EFD]"
      >
        {supportedLocales.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
