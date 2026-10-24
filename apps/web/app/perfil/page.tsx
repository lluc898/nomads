import Link from "next/link";

import { getUserProfileById } from "@viajeroshub/database";

import { Logo } from "@/components/logo";
import { requirePageAuth } from "@/lib/auth/guards";
import { getSafeCallbackUrl } from "@/lib/auth/redirects";
import { getDatabase } from "@/lib/database";

import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Mi perfil | ViajerosHub",
};

type ProfilePageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requirePageAuth();
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
          {profile.username ? (
            <Link
              href={`/viajeros/${profile.username}`}
              className="text-sm font-bold text-[#0B6EFD] hover:text-[#0857C9]"
            >
              Ver perfil público
            </Link>
          ) : (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0857C9]">
              Configuración obligatoria
            </span>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-sm font-bold text-[#0B6EFD]">Tu identidad viajera</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-slate-950 sm:text-4xl">
          {profile.username ? "Edita tu perfil" : "Completa tu perfil"}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          {profile.username
            ? "Esta información ayudará a que otros viajeros sepan quién se une a su grupo. Tu correo nunca se mostrará públicamente."
            : "Antes de continuar, elige tu nombre de usuario público. Será único y no podrá cambiarse después."}
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
