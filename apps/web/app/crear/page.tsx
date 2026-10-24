import { translate } from "@viajeroshub/shared";

import { LanguageSelector } from "@/components/language-selector";
import { Logo } from "@/components/logo";
import { requireCompleteProfilePage } from "@/lib/auth/guards";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { CreateTripForm } from "./trip-form";

export default async function CreateTripPage() {
  await requireCompleteProfilePage("/crear");
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5">
          <Logo />
          <LanguageSelector />
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <p className="text-sm font-bold tracking-widest text-[#0857C9] uppercase">
          {t("navCreate")}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          {t("createTrip")}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          {t("createIntro")}
        </p>
        <CreateTripForm />
      </section>
    </main>
  );
}
