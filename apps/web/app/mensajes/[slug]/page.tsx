import { getTripDetail } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { TripChat } from "@/app/viajes/[slug]/trip-chat";

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [session, locale, { slug }] = await Promise.all([
    auth(),
    getRequestLocale(),
    params,
  ]);
  if (!session?.user?.id) redirect("/acceso");
  const trip = await getTripDetail(
    getDatabase(),
    slug,
    locale,
    session.user.id,
  );
  if (!trip) notFound();
  if (
    trip.viewerMembershipStatus !== "owner" &&
    trip.viewerMembershipStatus !== "approved" &&
    trip.viewerMembershipStatus !== "left" &&
    trip.viewerMembershipStatus !== "expired"
  )
    redirect(`/viajes/${slug}`);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="px-5 pt-28 pb-4 md:pt-32">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/mensajes"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#0857C9]"
            >
              <ArrowLeftIcon className="size-4" /> {t("messages")}
            </Link>
            <h1 className="mt-2 truncate text-2xl font-extrabold text-slate-950">
              {trip.title}
            </h1>
          </div>
          <Link
            href={`/viajes/${trip.slug}`}
            className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            {t("goToTrip")}
          </Link>
        </div>
      </section>
      <TripChat
        slug={trip.slug}
        locale={locale}
        readOnly={
          trip.status === "archived" ||
          trip.viewerMembershipStatus === "left" ||
          trip.viewerMembershipStatus === "expired"
        }
      />
    </main>
  );
}
