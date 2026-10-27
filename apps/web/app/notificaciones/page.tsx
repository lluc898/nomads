import { listUserNotifications } from "@viajeroshub/database";
import { translate } from "@viajeroshub/shared";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { getDatabase } from "@/lib/database";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
  const [session, locale] = await Promise.all([auth(), getRequestLocale()]);
  if (!session?.user?.id) redirect("/acceso");
  const center = await listUserNotifications(getDatabase(), session.user.id);
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="px-5 pt-32 pb-16 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold tracking-widest text-[#0857C9] uppercase">
            ViajerosHub
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950 md:text-4xl">
            {translate(locale, "notifications")}
          </h1>
          <div className="mt-6">
            <NotificationList
              initialNotifications={center.notifications}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
