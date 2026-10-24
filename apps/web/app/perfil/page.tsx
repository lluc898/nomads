import Link from "next/link";

import { getUserProfileById } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";

import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/language-selector";
import { requirePageAuth } from "@/lib/auth/guards";
import { getSafeCallbackUrl } from "@/lib/auth/redirects";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Mi perfil | ViajerosHub",
};

type ProfilePageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requirePageAuth();
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const profile = await getUserProfileById(getDatabase(), user.id);
  const callbackUrl = getSafeCallbackUrl((await searchParams).callbackUrl);

  if (!profile) {
    throw new Error("No se ha encontrado el perfil del usuario autenticado.");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-4">
            <LanguageSelector />
            {profile.username ? (
              <Link
                href={`/viajeros/${profile.username}`}
                className="text-sm font-bold text-[#0B6EFD] hover:text-[#0857C9]"
              >
                {t("navProfile")}
              </Link>
            ) : (
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0857C9]">
                {t("firstStep")}
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-sm font-bold text-[#0B6EFD]">{t("yourAccount")}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-slate-950 sm:text-4xl">
          {profile.username ? t("editProfile") : t("completeProfile")}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          {t("profileIntro")}
        </p>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,.06)] sm:p-9">
          <ProfileForm
            profile={profile}
            callbackUrl={profile.username ? undefined : callbackUrl}
          />
        </div>
      </section>
    </main>
  );
}
