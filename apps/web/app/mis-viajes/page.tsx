import Link from "next/link";

import { Logo } from "@/components/logo";
import { requireCompleteProfilePage } from "@/lib/auth/guards";

export default async function MyTripsPage() {
  const { user } = await requireCompleteProfilePage("/mis-viajes");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <Link
            href="/crear"
            className="rounded-xl bg-[#0B6EFD] px-4 py-3 text-sm font-bold text-white"
          >
            Crear viaje
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-bold text-[#0B6EFD]">Tu espacio</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          Hola, {user.name ?? "viajero"}
        </h1>
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Todavía no tienes viajes
          </h2>
          <p className="mx-auto mt-2 max-w-md leading-6 text-slate-600">
            Crea tu primer plan o explora viajes publicados por otros viajeros.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/crear"
              className="rounded-xl bg-[#0B6EFD] px-5 py-3 font-bold text-white"
            >
              Crear un viaje
            </Link>
            <Link
              href="/buscar"
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              Explorar viajes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
