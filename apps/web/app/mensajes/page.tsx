import { listUserTripConversations } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function MessagesPage() {
  const [session, locale] = await Promise.all([auth(), getRequestLocale()]);
  if (!session?.user?.id) redirect("/acceso");
  const conversations = await listUserTripConversations(
    getDatabase(),
    session.user.id,
  );
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const dates = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="px-5 pt-32 pb-16 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">
            {t("messages")}
          </h1>
          <p className="mt-2 text-slate-600">{t("messagesSubtitle")}</p>
          <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {conversations.length ? (
              conversations.map((conversation) => (
                <Link
                  key={conversation.tripSlug}
                  href={`/mensajes/${conversation.tripSlug}`}
                  className="flex items-center gap-4 border-b border-slate-100 p-5 transition last:border-0 hover:bg-slate-50"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0B6EFD]">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 5.5h14v10H9l-4 3v-13Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-slate-950">
                      {conversation.tripTitle}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-500">
                      {conversation.lastMessage
                        ? `${conversation.lastSenderName ?? t("aTraveler")}: ${conversation.lastMessage}`
                        : t("noMessages")}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    {conversation.lastMessageAt ? (
                      <span className="text-xs text-slate-400">
                        {dates.format(new Date(conversation.lastMessageAt))}
                      </span>
                    ) : null}
                    {conversation.unreadCount ? (
                      <span className="grid min-w-6 place-items-center rounded-full bg-[#0B6EFD] px-1.5 text-xs leading-6 font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))
            ) : (
              <p className="p-10 text-center font-semibold text-slate-500">
                {t("noConversations")}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
