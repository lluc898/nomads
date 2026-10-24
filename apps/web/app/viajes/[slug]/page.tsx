import { getTripDetail } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getRequestLocale();
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  const trip = await getTripDetail(getDatabase(), (await params).slug, locale);
  if (!trip) notFound();
  const session = await auth();
  if (trip.visibility === "private" && session?.user?.id !== trip.creatorId)
    notFound();
  const dates = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="bg-[#EAF3FF] px-5 pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#0857C9]">
            {trip.visibility === "public" ? t("public") : t("private")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950">
            {t("tripTo", { destination: trip.destination })}
          </h1>
          <p className="mt-3 text-lg font-semibold text-slate-700">
            {trip.origin} → {trip.destination}
          </p>
          <p className="mt-2 text-slate-600">
            {dates.format(new Date(`${trip.departureDate}T00:00:00Z`))} –{" "}
            {dates.format(new Date(`${trip.returnDate}T00:00:00Z`))}
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-extrabold text-slate-950">
              {t("description")}
            </h2>
            <p className="mt-3 leading-7 whitespace-pre-wrap text-slate-600">
              {trip.description || t("createTripDescription")}
            </p>
          </article>
          {trip.links.length ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-extrabold text-slate-950">
                {t("bookingLinks")}
              </h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                {t("affiliateDisclosure")}
              </p>
              <div className="mt-5 space-y-3">
                {trip.links.map((link) => (
                  <a
                    key={link.id}
                    href={`/go/${link.id}`}
                    target="_blank"
                    rel="nofollow sponsored noreferrer"
                    className="flex min-h-14 items-center justify-between rounded-xl border border-blue-200 px-4 font-bold text-[#0857C9] hover:bg-blue-50"
                  >
                    <span>
                      {link.type === "flight" ? "✈️" : "🏨"} {link.name}
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </article>
          ) : null}
        </div>
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            {t("createdBy", {
              name:
                trip.creator?.name ?? trip.creator?.username ?? "ViajerosHub",
            })}
          </p>
          {trip.budget !== null ? (
            <p className="mt-5 text-sm text-slate-500">
              {t("guidePrice")}
              <span className="mt-1 block text-2xl font-extrabold text-slate-950">
                {trip.budget} {trip.currency}
              </span>
            </p>
          ) : null}
          <p className="mt-5 text-sm text-slate-500">
            {t("groupSizeOptional")}
            <span className="mt-1 block font-bold text-slate-900">
              {trip.maxParticipants ?? t("unlimited")}
            </span>
          </p>
        </aside>
      </section>
    </main>
  );
}
