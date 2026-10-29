import { getTripDetail } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { UserAvatar } from "@/components/user-avatar";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { TripMembership } from "./trip-membership";
import { ShareTripButton } from "./share-trip-button";

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
  const session = await auth();
  const trip = await getTripDetail(
    getDatabase(),
    (await params).slug,
    locale,
    session?.user?.id,
  );
  if (!trip || (trip.visibility === "private" && !session?.user?.id))
    notFound();
  const dates = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[#EAF3FF] px-5 pt-28 pb-8 md:pt-32 md:pb-10">
        {trip.destinationImage ? (
          <>
            <Image
              src={trip.destinationImage.url}
              alt={trip.destinationImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/35" />
          </>
        ) : null}
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#0857C9]">
              {trip.visibility === "public" ? t("public") : t("private")}
            </span>
            <ShareTripButton
              slug={trip.slug}
              title={t("tripTo", { destination: trip.destination })}
              label={t("shareTrip")}
              copiedLabel={t("linkCopied")}
            />
          </div>
          <h1
            className={`mt-4 text-3xl font-extrabold tracking-tight md:text-4xl ${
              trip.destinationImage ? "text-white" : "text-slate-950"
            }`}
          >
            {t("tripTo", { destination: trip.destination })}
          </h1>
          <p
            className={`mt-2 text-lg font-semibold ${
              trip.destinationImage ? "text-white/90" : "text-slate-700"
            }`}
          >
            {trip.origin} → {trip.destination}
          </p>
          <p
            className={`mt-1 ${
              trip.destinationImage ? "text-white/80" : "text-slate-600"
            }`}
          >
            {dates.format(new Date(`${trip.departureDate}T00:00:00Z`))} –{" "}
            {dates.format(new Date(`${trip.returnDate}T00:00:00Z`))}
          </p>
          {trip.destinationImage ? (
            <div className="mt-3 flex justify-end gap-1 text-[10px] text-white/80">
              <a
                href={trip.destinationImage.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="max-w-48 truncate rounded bg-black/40 px-2 py-1 hover:text-white"
                title={`${trip.destinationImage.author} · ${trip.destinationImage.license}`}
              >
                Foto: {trip.destinationImage.author}
              </a>
              {trip.destinationImage.licenseUrl ? (
                <a
                  href={trip.destinationImage.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-black/40 px-2 py-1 hover:text-white"
                >
                  {trip.destinationImage.license}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {trip.canViewPrivateContent ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-extrabold text-slate-950">
                {t("description")}
              </h2>
              <p className="mt-3 leading-7 whitespace-pre-wrap text-slate-600">
                {trip.description || t("createTripDescription")}
              </p>
            </article>
          ) : (
            <article className="rounded-3xl border border-blue-200 bg-blue-50 p-6 font-semibold text-blue-900">
              {t("privateContentPending")}
            </article>
          )}
          {trip.canViewPrivateContent && trip.participants.length ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-extrabold text-slate-950">
                {t("participants")} ({trip.participants.length})
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {trip.participants.map((participant) => (
                  <Link
                    key={participant.userId}
                    href={`/viajeros/${participant.username}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <UserAvatar
                      image={participant.image}
                      name={participant.name}
                      username={participant.username}
                      size="sm"
                    />
                    <div>
                      <p className="font-bold text-slate-900">
                        {participant.name ?? `@${participant.username}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {participant.role === "owner"
                          ? t("owner")
                          : t("participant")}
                      </p>
                    </div>
                    <span
                      className="ml-auto text-xl text-slate-400"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
          {trip.canViewPrivateContent && trip.links.length ? (
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
          {session?.user?.id ? (
            <div className="mb-6 border-b border-slate-200 pb-6">
              <TripMembership
                slug={trip.slug}
                visibility={trip.visibility}
                status={trip.viewerMembershipStatus}
                isFull={trip.isFull}
                pendingRequests={trip.pendingRequests}
                locale={locale}
              />
            </div>
          ) : null}
          {trip.viewerMembershipStatus === "owner" ||
          trip.viewerMembershipStatus === "approved" ? (
            <Link
              href={`/mensajes/${trip.slug}`}
              className="mb-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0B6EFD] px-4 font-bold text-white hover:bg-[#0857C9]"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 5.5h14v10H9l-4 3v-13Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              {t("openGroupChat")}
            </Link>
          ) : null}
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
            {trip.isFull ? t("tripFull") : t("availablePlaces")}
            <span className="mt-1 block font-bold text-slate-900">
              {trip.availablePlaces ?? t("unlimited")}
            </span>
          </p>
        </aside>
      </section>
    </main>
  );
}
