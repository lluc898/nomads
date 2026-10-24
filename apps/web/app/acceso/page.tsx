import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserProfileById } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";

import { auth, authCapabilities, signIn } from "@/auth";
import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/language-selector";
import { getProfileSetupUrl, getSafeCallbackUrl } from "@/lib/auth/redirects";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type AccessPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

const errorMessages: Record<string, string> = {
  AccessDenied: "No tienes permiso para acceder con esta cuenta.",
  Configuration: "El acceso todavía no está configurado en este entorno.",
  OAuthAccountNotLinked:
    "Ya existe una cuenta con este correo. Accede con el método que usaste originalmente.",
  OAuthCallback: "Google no ha podido completar el acceso. Inténtalo de nuevo.",
};

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const session = await auth();
  const locale = await getRequestLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);

  if (session?.user?.id) {
    const profile = await getUserProfileById(getDatabase(), session.user.id);

    if (!profile?.username) {
      redirect(getProfileSetupUrl(callbackUrl));
    }

    redirect(callbackUrl);
  }

  const errorMessage = params.error
    ? (errorMessages[params.error] ??
      "No hemos podido iniciar sesión. Inténtalo de nuevo.")
    : null;

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#0B6EFD] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-28 size-96 rounded-full border border-white/15" />
        <div className="absolute top-4 -right-10 size-64 rounded-full border border-white/15" />
        <Link href="/" className="relative w-fit brightness-0 invert">
          <Logo />
        </Link>
        <div className="relative max-w-xl">
          <p className="text-sm font-bold tracking-[.14em] text-blue-100 uppercase">
            {t("accessTitle")}
          </p>
          <h1 className="mt-4 text-5xl leading-[1.08] font-extrabold tracking-[-.045em]">
            Viajar es mejor cuando encuentras a las personas adecuadas.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
            Guarda tus planes, solicita unirte a grupos y conversa con tus
            compañeros de viaje desde un único lugar.
          </p>
        </div>
        <p className="relative text-sm text-blue-100">
          Reservas siempre directamente con el proveedor.
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <div className="absolute top-6 right-6 hidden lg:block">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Logo />
            <LanguageSelector />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,.08)] sm:p-10">
            <p className="text-sm font-bold text-[#0B6EFD]">Bienvenido</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-slate-950">
              Accede a ViajerosHub
            </h2>
            <p className="mt-3 leading-6 text-slate-600">
              Entra para crear viajes, unirte a grupos y hablar con otros
              viajeros.
            </p>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            ) : null}

            {authCapabilities.google ? (
              <form
                className="mt-8"
                action={async () => {
                  "use server";
                  await signIn("google", {
                    redirectTo: `/acceso?callbackUrl=${encodeURIComponent(callbackUrl)}`,
                  });
                }}
              >
                <button
                  type="submit"
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <GoogleIcon />
                  {t("continueGoogle")}
                </button>
              </form>
            ) : (
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">
                  Acceso pendiente de configuración
                </p>
                <p className="mt-1 text-sm leading-5 text-amber-800">
                  Añade las credenciales de Google y la conexión PostgreSQL al
                  entorno para activar el inicio de sesión.
                </p>
              </div>
            )}

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              {t("terms")}
            </p>
          </div>
          <Link
            href="/"
            className="mt-6 block text-center text-sm font-semibold text-slate-600 hover:text-[#0B6EFD]"
          >
            ← Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.05a10 10 0 0 0 0 8.99l3.35-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.51l3.35 2.6C7.19 7.73 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}
