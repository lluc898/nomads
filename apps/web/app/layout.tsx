import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { translate } from "@viajeroshub/shared";

import { I18nProvider } from "@/components/i18n-provider";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: `ViajerosHub · ${translate(locale, "homeTitle")} ${translate(locale, "homeTitleAccent")}`,
    description: translate(locale, "homeSubtitle"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body className={geist.variable}>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
