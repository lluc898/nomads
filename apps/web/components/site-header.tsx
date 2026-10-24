import Link from "next/link";

import { auth, signOut } from "@/auth";

import { Logo } from "./logo";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav
          className="hidden items-center gap-7 text-sm font-semibold text-slate-700 md:flex"
          aria-label="Navegación principal"
        >
          <Link href="/buscar" className="transition hover:text-[#0B6EFD]">
            Explorar viajes
          </Link>
          <Link
            href="/como-funciona"
            className="transition hover:text-[#0B6EFD]"
          >
            Cómo funciona
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/mis-viajes"
                className="transition hover:text-[#0B6EFD]"
              >
                Mis viajes
              </Link>
              <Link href="/perfil" className="transition hover:text-[#0B6EFD]">
                Mi perfil
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer transition hover:text-[#0B6EFD]"
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <Link href="/acceso" className="transition hover:text-[#0B6EFD]">
              Iniciar sesión
            </Link>
          )}
          <Link
            href="/crear"
            className="rounded-xl bg-[#0B6EFD] px-4 py-3 text-white shadow-[0_6px_18px_rgba(11,110,253,.2)] transition hover:bg-[#0857C9]"
          >
            Crear viaje
          </Link>
        </nav>
        <Link
          href={session?.user ? "/perfil" : "/acceso"}
          className="rounded-xl bg-[#0B6EFD] px-4 py-2.5 text-sm font-bold text-white md:hidden"
        >
          {session?.user ? "Mi cuenta" : "Entrar"}
        </Link>
      </div>
    </header>
  );
}
