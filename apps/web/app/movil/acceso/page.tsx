import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Logo } from "@/components/logo";
import {
  getSafeMobileReturnUrl,
  isValidPkceChallenge,
} from "@/lib/mobile-auth";

type MobileAccessPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    challenge?: string;
    error?: string;
  }>;
};

export default async function MobileAccessPage({
  searchParams,
}: MobileAccessPageProps) {
  const params = await searchParams;
  const returnTo = getSafeMobileReturnUrl(params.returnTo ?? null);
  const challenge = params.challenge ?? "";

  if (!returnTo || !isValidPkceChallenge(challenge)) {
    return <InvalidRequest />;
  }

  const finalizeUrl = `/movil/finalizar?returnTo=${encodeURIComponent(returnTo.toString())}&challenge=${challenge}`;
  const session = await auth();
  if (session?.user?.id) redirect(finalizeUrl);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,.08)]">
        <Logo />
        <p className="mt-8 text-sm font-bold text-[#0B6EFD]">App móvil</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          Accede a ViajerosHub
        </h1>
        <p className="mt-3 leading-6 text-slate-600">
          Usa tu cuenta de Google. Al terminar volverás automáticamente a la
          app.
        </p>
        {params.error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            No hemos podido completar el acceso. Inténtalo de nuevo.
          </p>
        ) : null}
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: finalizeUrl });
          }}
        >
          <button className="min-h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 font-bold text-slate-800 hover:bg-slate-50">
            Continuar con Google
          </button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Puedes cerrar esta ventana para cancelar.
        </p>
      </div>
    </main>
  );
}

function InvalidRequest() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-950">Enlace no válido</h1>
        <p className="mt-2 text-slate-600">
          Vuelve a la app e inicia el acceso otra vez.
        </p>
      </div>
    </main>
  );
}
