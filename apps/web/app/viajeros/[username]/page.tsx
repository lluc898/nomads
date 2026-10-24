import { getUserProfileByUsername } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/language-selector";
import { UserAvatar } from "@/components/user-avatar";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getUserProfileByUsername(
    getDatabase(),
    username.toLowerCase(),
  );

  return {
    title: profile ? `@${profile.username} | ViajerosHub` : "ViajerosHub",
    description: profile ? `@${profile.username} · ViajerosHub` : undefined,
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const profile = await getUserProfileByUsername(
    getDatabase(),
    username.toLowerCase(),
  );

  if (!profile?.username) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              href="/buscar"
              className="text-sm font-bold text-[#0B6EFD] hover:text-[#0857C9]"
            >
              {t("navExplore")}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,.07)]">
          <div className="h-28 bg-gradient-to-r from-[#0B6EFD] to-[#4F9CFF] sm:h-36" />
          <div className="px-6 pb-8 sm:px-10 sm:pb-10">
            <div className="-mt-14">
              <UserAvatar
                image={profile.image}
                name={profile.name}
                username={profile.username}
                size="lg"
              />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-.035em] text-slate-950">
              {profile.name ?? `@${profile.username}`}
            </h1>
            <p className="mt-1 font-bold text-[#0B6EFD]">@{profile.username}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              {profile.instagramUrl ? (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-bold text-slate-700 transition hover:border-[#0B6EFD] hover:text-[#0B6EFD]"
                >
                  {t("viewInstagram")}
                </a>
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-500">
                  {t("noPublicInstagram")}
                </span>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
