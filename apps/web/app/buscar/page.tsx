import Link from "next/link";

import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";

type SearchPageProps = {
  searchParams: Promise<{ origen?: string; destino?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const hasSearch = Boolean(params.origen || params.destino);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="bg-[#EAF3FF] px-5 pt-32 pb-10 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold tracking-widest text-[#0857C9] uppercase">
            Encuentra tu grupo
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Buscar viajes
          </h1>
          <p className="mt-2 text-slate-600">
            Busca por país o por un aeropuerto concreto.
          </p>
          <div className="mt-7">
            <SearchForm />
          </div>
        </div>
      </section>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
            ⌕
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
            {hasSearch
              ? "No hay viajes publicados para esta ruta"
              : "Elige desde dónde quieres viajar"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl leading-6 text-slate-600">
            {hasSearch
              ? "El catálogo mundial ya está conectado. Puedes ser la primera persona en publicar este viaje."
              : "Puedes seleccionar un país entero, un aeropuerto o Cualquier lugar como destino."}
          </p>
          {hasSearch ? (
            <Link
              href="/crear"
              className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#0B6EFD] px-6 font-bold text-white hover:bg-[#0857C9]"
            >
              Crear este viaje
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
