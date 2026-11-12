import type { AppNotification } from "@viajeroshub/shared";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { PUSH_TOKEN_KEY } from "@/lib/push-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locale } = useI18n();
  const {
    status,
    listNotifications,
    markNotificationRead,
    subscribeNotifications,
    registerPushToken,
  } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "signedIn") return;
    setError(false);
    try {
      const center = await listNotifications();
      setNotifications(center.notifications);
      setUnreadCount(center.unreadCount);
    } catch (caught) {
      console.warn("Notifications load failed", caught);
      setError(true);
      throw caught;
    } finally {
      setLoading(false);
    }
  }, [listNotifications, status]);

  useEffect(() => {
    if (status !== "signedIn") return;
    let active = true;
    listNotifications()
      .then((center) => {
        if (!active) return;
        setNotifications(center.notifications);
        setUnreadCount(center.unreadCount);
      })
      .catch((caught) => {
        console.warn("Initial notifications load failed", caught);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const controller = new AbortController();
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      void subscribeNotifications(
        () => void refresh(),
        controller.signal,
      ).catch(() => {
        if (!controller.signal.aborted) reconnect = setTimeout(connect, 3_000);
      });
    };
    connect();
    return () => {
      active = false;
      controller.abort();
      if (reconnect) clearTimeout(reconnect);
    };
  }, [listNotifications, refresh, status, subscribeNotifications]);

  useEffect(() => {
    if (status !== "signedIn" || !Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      string | undefined;
    if (!projectId || (Platform.OS !== "ios" && Platform.OS !== "android"))
      return;
    const platform: "ios" | "android" = Platform.OS;
    Notifications.getPermissionsAsync()
      .then(async (current) =>
        current.status === "granted"
          ? current
          : Notifications.requestPermissionsAsync(),
      )
      .then(async (permission) => {
        if (permission.status !== "granted") return;
        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        await registerPushToken(pushToken.data, platform, locale);
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken.data);
      })
      .catch(() => undefined);
  }, [locale, registerPushToken, status]);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      const slug = response.notification.request.content.data?.tripSlug;
      if (typeof slug === "string") router.push(`/trips/${slug}`);
    };
    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) open(response);
    });
    return () => subscription.remove();
  }, [router]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const wasUnread = notifications.some(
        (notification) =>
          notification.id === notificationId && !notification.isRead,
      );
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1));
      await markNotificationRead({ notificationId });
    },
    [markNotificationRead, notifications],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);
    await markNotificationRead({ all: true });
  }, [markNotificationRead]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      error,
      loading,
      markAllRead,
      markRead,
      notifications,
      refresh,
      unreadCount,
    ],
  );
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context)
    throw new Error(
      "useNotifications debe usarse dentro de NotificationsProvider.",
    );
  return context;
}
