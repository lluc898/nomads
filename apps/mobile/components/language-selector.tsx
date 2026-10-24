import { supportedLocales } from "@viajeroshub/shared";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useI18n } from "@/lib/i18n-context";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("language")}
        onPress={() => setOpen(true)}
        className="h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 active:bg-slate-100"
      >
        <Text className="text-xs font-extrabold uppercase text-slate-700">
          {locale}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 items-center justify-center bg-slate-950/40 px-6"
        >
          <View className="w-full max-w-sm rounded-3xl bg-white p-5">
            <Text className="mb-3 text-xl font-extrabold text-slate-950">
              {t("language")}
            </Text>
            {supportedLocales.map((option) => (
              <Pressable
                key={option.code}
                accessibilityRole="button"
                accessibilityState={{ selected: locale === option.code }}
                onPress={() => {
                  setLocale(option.code);
                  setOpen(false);
                }}
                className={`min-h-12 flex-row items-center justify-between rounded-xl px-4 ${locale === option.code ? "bg-brand-50" : "active:bg-slate-50"}`}
              >
                <Text
                  className={`font-bold ${locale === option.code ? "text-brand-600" : "text-slate-700"}`}
                >
                  {option.label}
                </Text>
                {locale === option.code ? (
                  <Text className="text-brand-500">✓</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
